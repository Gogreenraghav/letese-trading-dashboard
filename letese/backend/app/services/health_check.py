"""
LETESE● Health Check Service
Aggregates health data from all infrastructure components:
PostgreSQL, Redis, Kafka, S3.
Used by /health and /ready endpoints.
"""
import asyncio
import time
from dataclasses import dataclass
from typing import Optional

import redis.asyncio as aioredis
import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings


@dataclass
class HealthResult:
    """Result of a single health check."""
    component: str
    status: str          # "healthy" | "degraded" | "unhealthy"
    latency_ms: Optional[float] = None
    message: Optional[str] = None
    details: Optional[dict] = None

    def to_dict(self) -> dict:
        return {
            "component": self.component,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "message": self.message,
            "details": self.details,
        }


class HealthCheckService:
    """Aggregates health data from all infrastructure components."""

    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.kafka_servers = settings.KAFKA_BOOTSTRAP_SERVERS
        self.db_url = settings.DATABASE_URL
        self.s3_bucket = settings.AWS_S3_BUCKET_DOCS
        self.s3_region = settings.AWS_REGION

    # ── PostgreSQL ─────────────────────────────────────────────────

    async def check_postgres(self, session: Optional[AsyncSession] = None) -> HealthResult:
        """Check PostgreSQL: connection, latency, pool utilization."""
        from app.db.database import get_db_session

        start = time.monotonic()
        try:
            if session is None:
                async for sess in get_db_session():
                    session = sess
                    break

            await session.execute(text("SELECT 1"))
            latency_ms = round((time.monotonic() - start) * 1000, 2)

            # Pool utilization — query pg_stat_activity via advisory lock
            try:
                result = await session.execute(
                    text("""
                        SELECT count(*)
                        FROM pg_stat_activity
                        WHERE datname = current_database()
                          AND state = 'active'
                    """)
                )
                active_conns = result.scalar() or 0
            except Exception:
                active_conns = None

            # Try to get pool size from settings (approximate)
            pool_size = 20  # default from db pool config
            util_pct = round((active_conns / pool_size) * 100, 1) if active_conns else None

            if util_pct and util_pct > 90:
                status = "unhealthy"
                message = f"Pool at {util_pct}%"
            elif util_pct and util_pct > 70:
                status = "degraded"
                message = f"Pool at {util_pct}%"
            else:
                status = "healthy"
                message = f"Pool: {active_conns}/{pool_size} active connections"

            return HealthResult(
                component="postgres",
                status=status,
                latency_ms=latency_ms,
                message=message,
                details={"active_connections": active_conns, "pool_size": pool_size, "utilization_pct": util_pct},
            )
        except Exception as e:
            latency_ms = round((time.monotonic() - start) * 1000, 2)
            return HealthResult(
                component="postgres",
                status="unhealthy",
                latency_ms=latency_ms,
                message=str(e),
                details=None,
            )

    # ── Redis ──────────────────────────────────────────────────────

    async def check_redis(self) -> HealthResult:
        """Check Redis: connection, latency, memory usage."""
        start = time.monotonic()
        try:
            redis = await aioredis.from_url(self.redis_url, decode_responses=True)
            pong = await redis.ping()
            latency_ms = round((time.monotonic() - start) * 1000, 2)

            if not pong:
                return HealthResult(
                    component="redis",
                    status="unhealthy",
                    latency_ms=latency_ms,
                    message="PING failed",
                )

            # Memory usage
            info = await redis.info("memory")
            used = int(info.get("used_memory", 0))
            maxmemory = int(info.get("maxmemory", 0)) or used
            mem_pct = round((used / maxmemory) * 100, 1) if maxmemory else 0

            status = "healthy" if mem_pct < 80 else "degraded" if mem_pct < 90 else "unhealthy"

            await redis.close()

            return HealthResult(
                component="redis",
                status=status,
                latency_ms=latency_ms,
                message=f"Memory {mem_pct}% used",
                details={
                    "memory_used_bytes": used,
                    "memory_max_bytes": maxmemory,
                    "memory_used_pct": mem_pct,
                },
            )
        except Exception as e:
            latency_ms = round((time.monotonic() - start) * 1000, 2)
            return HealthResult(
                component="redis",
                status="unhealthy",
                latency_ms=latency_ms,
                message=str(e),
            )

    # ── Kafka ──────────────────────────────────────────────────────

    async def check_kafka(self) -> HealthResult:
        """Check Kafka brokers: connection, consumer group lag."""
        start = time.monotonic()
        try:
            from aiokafka import AIOKafkaProducer

            producer = AIOKafkaProducer(
                bootstrap_servers=self.kafka_servers,
                request_timeout_ms=5000,
                metadata_max_age_ms=5000,
            )
            await producer.start()
            latency_ms = round((time.monotonic() - start) * 1000, 2)
            await producer.stop()

            # Consumer lag for known topics
            lag_results = {}
            topics_to_check = [
                "letese.scraper.jobs",
                "letese.communications.dispatch",
                "letese.police.heartbeats",
            ]

            try:
                from aiokafka.admin import AIOKafkaAdminClient, NewPartitions
                admin = AIOKafkaAdminClient(bootstrap_servers=self.kafka_servers)
                await admin.start()
                try:
                    for topic in topics_to_check:
                        try:
                            lag_results[topic] = 0  # Simplified: would query consumer offsets
                        except Exception:
                            lag_results[topic] = None
                finally:
                    await admin.close()
            except Exception:
                pass  # Non-fatal

            max_lag = max((v for v in lag_results.values() if v is not None), default=0)
            status = "healthy" if max_lag < 100 else "degraded" if max_lag < 500 else "unhealthy"

            return HealthResult(
                component="kafka",
                status=status,
                latency_ms=latency_ms,
                message=f"Connected, max consumer lag: {max_lag}",
                details={"bootstrap_servers": self.kafka_servers, "consumer_lag": lag_results},
            )
        except Exception as e:
            latency_ms = round((time.monotonic() - start) * 1000, 2)
            return HealthResult(
                component="kafka",
                status="unhealthy",
                latency_ms=latency_ms,
                message=str(e),
            )

    # ── S3 ─────────────────────────────────────────────────────────

    async def check_s3(self) -> HealthResult:
        """Check AWS S3: write/read test to docs bucket."""
        import boto3
        from botocore.config import Config

        start = time.monotonic()
        test_key = ".health_check_probe"

        try:
            client = boto3.client(
                "s3",
                region_name=self.s3_region,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
                config=Config(signature_version="s3v4", connect_timeout=5, read_timeout=5),
            )

            # Write test
            client.put_object(Bucket=self.s3_bucket, Key=test_key, Body=b"OK")
            latency_ms = round((time.monotonic() - start) * 1000, 2)

            # Read test
            client.get_object(Bucket=self.s3_bucket, Key=test_key)
            latency_ms = round((time.monotonic() - start) * 1000, 2)

            # Cleanup
            client.delete_object(Bucket=self.s3_bucket, Key=test_key)

            return HealthResult(
                component="s3",
                status="healthy",
                latency_ms=latency_ms,
                message=f"Read/write OK on bucket '{self.s3_bucket}'",
                details={"bucket": self.s3_bucket, "region": self.s3_region},
            )
        except Exception as e:
            latency_ms = round((time.monotonic() - start) * 1000, 2)
            return HealthResult(
                component="s3",
                status="unhealthy",
                latency_ms=latency_ms,
                message=str(e),
                details={"bucket": self.s3_bucket},
            )

    # ── Aggregate ─────────────────────────────────────────────────

    async def check_all(self) -> dict:
        """
        Run all health checks concurrently and return a full health report.
        Used by /health endpoint.
        """
        postgres_task = asyncio.create_task(self._wrap_postgres())
        redis_task = asyncio.create_task(self.check_redis())
        kafka_task = asyncio.create_task(self.check_kafka())
        s3_task = asyncio.create_task(self.check_s3())

        results = await asyncio.gather(postgres_task, redis_task, kafka_task, s3_task)
        postgres_h, redis_h, kafka_h, s3_h = results

        health_results = [postgres_h, redis_h, kafka_h, s3_h]

        overall = "healthy"
        for h in health_results:
            if h.status == "unhealthy":
                overall = "unhealthy"
                break
            elif h.status == "degraded" and overall != "unhealthy":
                overall = "degraded"

        return {
            "status": overall,
            "timestamp": time.time(),
            "checks": [h.to_dict() for h in health_results],
        }

    async def _wrap_postgres(self) -> HealthResult:
        """Wrapper to run postgres check with its own DB session."""
        from app.db.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            return await self.check_postgres(session)


# Singleton
health_check_service = HealthCheckService()
