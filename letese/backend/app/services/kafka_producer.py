"""
LETESE● Kafka Producer — Publishes jobs to LETESE Kafka topics
"""
import json
import logging
from typing import Optional

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
