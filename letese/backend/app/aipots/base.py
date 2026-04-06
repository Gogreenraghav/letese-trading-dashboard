"""
LETESE● AIPOT Base Class
Lifecycle, retry with exponential backoff, Kafka producer, Redis, heartbeat.
All AIPOT agents inherit from BaseAIPOT.
"""
import asyncio
import json
import time
import logging
from abc import ABC, abstractmethod
from typing import Optional

logger = logging.getLogger(__name__)


class BaseAIPOT(ABC):
    HEARTBEAT_INTERVAL_SECONDS = 60
    MAX_RETRY_ATTEMPTS = 3
    RETRY_BACKOFF_BASE = 2  # seconds: 2, 4, 8

    def __init__(self, agent_id: str, kafka_servers: str, redis_url: str):
        self.agent_id = agent_id
        self.kafka_servers = kafka_servers
        self.redis_url = redis_url
        self.consumer = None
        self.producer = None
        self.redis = None
        self._running = False

    async def start(self):
        """Start Kafka consumer + producer, Redis, heartbeat loop, consume loop."""
        from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
        import redis.asyncio as aioredis

        self.consumer = AIOKafkaConsumer(
            self.input_topic,
            bootstrap_servers=self.kafka_servers,
            group_id=f"letese-{self.agent_id}",
            auto_offset_reset="earliest",
            enable_auto_commit=False,
            max_poll_records=10,
        )
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.kafka_servers,
            value_serializer=lambda v: json.dumps(v).encode(),
        )
        self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)

        await self.consumer.start()
        await self.producer.start()
        self._running = True

        logger.info(f"[{self.agent_id}] AWAKE — consuming {self.input_topic}")
        asyncio.create_task(self._heartbeat_loop())
        await self._consume_loop()

    async def stop(self):
        """Graceful shutdown."""
        self._running = False
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()
        if self.redis:
            await self.redis.close()
        logger.info(f"[{self.agent_id}] SLEEPING")

    async def _heartbeat_loop(self):
        """Publish alive heartbeat to letese.police.heartbeats every 60s."""
        while self._running:
            try:
                await self.producer.send("letese.police.heartbeats", {
                    "agent_id": self.agent_id,
                    "timestamp": time.time(),
                    "status": "alive",
                    "input_topic": self.input_topic,
                })
            except Exception as e:
                logger.warning(f"[{self.agent_id}] Heartbeat failed: {e}")
            await asyncio.sleep(self.HEARTBEAT_INTERVAL_SECONDS)

    async def _consume_loop(self):
        """Main message loop with retry logic."""
        async for msg in self.consumer:
            if not self._running:
                break
            payload = json.loads(msg.value)
            attempt = 0
            while attempt < self.MAX_RETRY_ATTEMPTS:
                try:
                    start = time.monotonic()
                    await self.process_message(payload)
                    duration_ms = int((time.monotonic() - start) * 1000)
                    await self._emit_metric("SUCCESS", duration_ms, payload)
                    await self.consumer.commit()
                    break
                except Exception as e:
                    attempt += 1
                    wait = self.RETRY_BACKOFF_BASE ** attempt
                    logger.warning(
                        f"[{self.agent_id}] Attempt {attempt} failed: {e}. "
                        f"Retry in {wait}s"
                    )
                    if attempt >= self.MAX_RETRY_ATTEMPTS:
                        await self._publish_to_dlq(payload, str(e))
                        await self._publish_error(payload, str(e))
                        await self.consumer.commit()
                    else:
                        await asyncio.sleep(wait)

    async def _publish_to_dlq(self, payload: dict, error: str):
        """Move failed message to Dead Letter Queue."""
        await self.producer.send(f"{self.input_topic}.dlq", {
            "original_payload": payload,
            "error": error,
            "agent_id": self.agent_id,
            "failed_at": time.time(),
        })

    async def _publish_error(self, payload: dict, error: str):
        """Publish to letese.police.errors for alerting."""
        await self.producer.send("letese.police.errors", {
            "agent_id": self.agent_id,
            "error": error,
            "payload": payload,
            "timestamp": time.time(),
        })

    async def _emit_metric(self, outcome: str, duration_ms: int, payload: dict):
        """Emit processing metric to letese.police.metrics."""
        await self.producer.send("letese.police.metrics", {
            "agent_id": self.agent_id,
            "outcome": outcome,
            "duration_ms": duration_ms,
            "tenant_id": payload.get("tenant_id"),
            "timestamp": time.time(),
        })

    @property
    @abstractmethod
    def input_topic(self) -> str:
        """Kafka topic this agent consumes from."""
        pass

    @abstractmethod
    async def process_message(self, payload: dict) -> None:
        """Process one message. Implement in subclass."""
        pass
