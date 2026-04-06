#!/usr/bin/env python3
"""
LETESE● Kafka Admin — Create Topics via kafka-python or aiokafka
Usage: python kafka_admin.py [--bootstrap-server localhost:9092] [--create-dlqs]

Run as:
    python kafka_admin.py --bootstrap-server localhost:9092
    python kafka_admin.py --dry-run  # just print what would be created
"""
import asyncio
import argparse
import sys
import logging
from typing import Optional

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

TOPICS = [
    {
        "name": "letese.scraper.jobs",
        "retention_ms": 3_600_000,      # 1 hour
        "partitions": 6,
    },
    {
        "name": "letese.diary.updates",
        "retention_ms": 86_400_000,     # 24 hours
        "partitions": 3,
    },
    {
        "name": "letese.orders.new",
        "retention_ms": 86_400_000,     # 24 hours
        "partitions": 3,
    },
    {
        "name": "letese.communications.dispatch",
        "retention_ms": 86_400_000,     # 24 hours
        "partitions": 6,
    },
    {
        "name": "letese.police.heartbeats",
        "retention_ms": 7_200_000,      # 2 hours
        "partitions": 1,
    },
    {
        "name": "letese.police.errors",
        "retention_ms": 604_800_000,    # 7 days
        "partitions": 3,
    },
    {
        "name": "letese.police.metrics",
        "retention_ms": 604_800_000,    # 7 days
        "partitions": 1,
    },
    {
        "name": "letese.build.status",
        "retention_ms": 604_800_000,    # 7 days
        "partitions": 1,
    },
]

# DLQ topics (dead-letter queues) for each input topic
DLQ_TOPICS = [
    {
        "name": "letese.scraper.jobs.dlq",
        "retention_ms": 604_800_000,
        "partitions": 3,
    },
    {
        "name": "letese.communications.dispatch.dlq",
        "retention_ms": 604_800_000,
        "partitions": 3,
    },
]

try:
    from kafka.admin import KafkaAdminClient, NewTopic
    from kafka.errors import TopicAlreadyExistsError, InvalidTopicException
    KAFKA_PYTHON_AVAILABLE = True
except ImportError:
    KAFKA_PYTHON_AVAILABLE = False


async def create_topics_aiokafka(bootstrap_servers: str, dry_run: bool = False):
    """Create topics using aiokafka (async — preferred)."""
    try:
        from aiokafka import AIOKafkaAdminClient, NewTopic as AIONewTopic
    except ImportError:
        logger.error("aiokafka not installed. Install with: pip install aiokafka")
        return False

    admin = AIOKafkaAdminClient(bootstrap_servers=bootstrap_servers)
    await admin.start()

    try:
        all_topics = TOPICS + DLQ_TOPICS
        new_topics = [
            AIONewTopic(
                name=t["name"],
                num_partitions=t["partitions"],
                replication_factor=1,
                topic_configs={
                    "retention.ms": {"value": str(t["retention_ms"])}
                },
            )
            for t in all_topics
        ]

        if dry_run:
            logger.info("[DRY RUN] Would create topics:")
            for t in all_topics:
                logger.info(
                    f"  {t['name']} (partitions={t['partitions']}, "
                    f"retention={t['retention_ms']}ms)"
                )
            return True

        await admin.create_topics(new_topics, validate_only=False)
        logger.info(f"Created {len(all_topics)} topics successfully.")
        return True

    except Exception as e:
        if "TOPIC_ALREADY_EXISTS" in str(e) or "TopicExistsException" in str(type(e).__name__):
            logger.warning(f"Some topics already exist: {e}")
            return True
        logger.error(f"Failed to create topics: {e}")
        return False
    finally:
        await admin.close()


def create_topics_kafka_python(bootstrap_servers: str, dry_run: bool = False):
    """Create topics using kafka-python (sync fallback)."""
    if not KAFKA_PYTHON_AVAILABLE:
        logger.error("kafka-python not installed. Install with: pip install kafka-python")
        sys.exit(1)

    admin = KafkaAdminClient(bootstrap_servers=bootstrap_servers)

    try:
        all_topics = TOPICS + DLQ_TOPICS
        new_topics = [
            NewTopic(
                name=t["name"],
                num_partitions=t["partitions"],
                replication_factor=1,
                topic_configs={
                    "retention.ms": str(t["retention_ms"])
                },
            )
            for t in all_topics
        ]

        if dry_run:
            logger.info("[DRY RUN] Would create topics:")
            for t in all_topics:
                logger.info(
                    f"  {t['name']} (partitions={t['partitions']}, "
                    f"retention={t['retention_ms']}ms)"
                )
            return True

        admin.create_topics(new_topics, validate_only=False)
        logger.info(f"Created {len(all_topics)} topics successfully.")
        return True

    except TopicAlreadyExistsError:
        logger.warning("Some topics already exist — continuing.")
        return True
    except Exception as e:
        logger.error(f"Failed to create topics: {e}")
        return False
    finally:
        admin.close()


async def main():
    parser = argparse.ArgumentParser(description="LETESE● Kafka Topic Admin")
    parser.add_argument(
        "--bootstrap-server",
        default="localhost:9092",
        help="Kafka bootstrap server (default: localhost:9092)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print topics that would be created without creating them",
    )
    parser.add_argument(
        "--no-dlq",
        action="store_true",
        help="Skip DLQ topic creation",
    )
    args = parser.parse_args()

    bootstrap = args.bootstrap_server

    logger.info(f"Connecting to Kafka at {bootstrap}")

    # Prefer aiokafka (async)
    if KAFKA_PYTHON_AVAILABLE:
        # Try aiokafka first (better for async use)
        try:
            success = await create_topics_aiokafka(bootstrap, dry_run=args.dry_run)
        except Exception:
            logger.info("aiokafka not available — falling back to kafka-python")
            success = create_topics_kafka_python(bootstrap, dry_run=args.dry_run)
    else:
        success = await create_topics_aiokafka(bootstrap, dry_run=args.dry_run)

    if success:
        logger.info("Done.")
    else:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
