"""
LETESE● Kafka Producer — Publishes jobs to LETESE Kafka topics
"""
import json
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_kafka_producer = None


async def get_kafka_producer():
    global _kafka_producer
    if _kafka_producer is None:
        try:
            from aiokafka import AIOKafkaProducer
            from app.core.config import settings
            _kafka_producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode(),
            )
            await _kafka_producer.start()
        except Exception as e:
            logger.warning(f"Kafka not available: {e}. Running without Kafka.")
            return None
    return _kafka_producer


async def publish_scrape_job(payload: dict) -> bool:
    """Publish to letese.scraper.jobs topic."""
    try:
        producer = await get_kafka_producer()
        if producer:
            await producer.send("letese.scraper.jobs", payload)
            logger.info(f"Published scrape job for case {payload.get('case_id')}")
            return True
    except Exception as e:
        logger.warning(f"Failed to publish scrape job: {e}")
    return False


async def publish_diary_update(payload: dict) -> bool:
    """Publish to letese.diary.updates topic."""
    try:
        producer = await get_kafka_producer()
        if producer:
            await producer.send("letese.diary.updates", payload)
            return True
    except Exception as e:
        logger.warning(f"Failed to publish diary update: {e}")
    return False


async def publish_communication_dispatch(payload: dict) -> bool:
    """Publish to letese.communications.dispatch topic."""
    try:
        producer = await get_kafka_producer()
        if producer:
            await producer.send("letese.communications.dispatch", payload)
            return True
    except Exception as e:
        logger.warning(f"Failed to publish comm dispatch: {e}")
    return False


async def publish_build_status(payload: dict) -> bool:
    """Publish to letese.build.status topic (agent coordination)."""
    try:
        producer = await get_kafka_producer()
        if producer:
            await producer.send("letese.build.status", payload)
            return True
    except Exception as e:
        logger.warning(f"Failed to publish build status: {e}")
    return False


async def publish_to_topic(topic: str, payload: dict) -> bool:
    """
    Generic publish — sends a dict payload to any Kafka topic.

    Args:
        topic:   Full topic name (e.g. "letese.diary.updates")
        payload: JSON-serialisable dict

    Returns:
        True if published, False on failure / no producer.
    """
    try:
        producer = await get_kafka_producer()
        if producer is None:
            logger.warning(f"[publish_to_topic] No producer for {topic}")
            return False
        await producer.send(topic, payload)
        logger.debug(f"[publish_to_topic] -> {topic}: {payload.get('event_type', '?')}")
        return True
    except Exception as e:
        logger.warning(f"[publish_to_topic] Failed to publish to {topic}: {e}")
        return False


async def check_kafka_health() -> bool:
    """
    Lightweight Kafka health check — attempts to fetch cluster metadata.

    Returns:
        True  → broker reachable and responsive
        False → broker unreachable or error
    """
    try:
        from app.core.config import settings
        async with httpx.AsyncClient(timeout=5) as client:
            # Kafka's REST proxy or kraft mode may expose /v1/metadata
            # Fallback: try a raw socket ping via kafka-python AdminClient
            from kafka.admin import KafkaAdminClient
            admin = KafkaAdminClient(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                request_timeout_ms=3000,
            )
            admin.close()
            return True
    except ImportError:
        pass
    except Exception as e:
        logger.debug(f"[kafka_health] Check failed: {e}")
        return False

    # Fallback: attempt to connect with aiokafka admin client
    try:
        from aiokafka import AIOKafkaAdminClient
        from app.core.config import settings
        admin = AIOKafkaAdminClient(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            request_timeout_ms=3000,
        )
        await admin.start()
        await admin.close()
        return True
    except Exception as e:
        logger.debug(f"[kafka_health] aiokafka check failed: {e}")
        return False
