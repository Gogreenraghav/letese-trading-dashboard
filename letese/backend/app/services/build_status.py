"""
LETESE● Build Status Publisher
Publishes agent module status to letese.build.status Kafka topic
per SYSTEM_MASTER_BLUEPRINT RULE 3.
"""
import logging
import time

from app.services.kafka_producer import get_kafka_producer

logger = logging.getLogger(__name__)


async def publish_build_status(
    agent_id: str,
    module: str,
    day: int,
    status: str,
    blocker: str | None = None,
    output_url: str | None = None,
    triggered_by: str | None = None,
    audit_type: str | None = None,
) -> bool:
    """
    Publish a build-status event to letese.build.status.

    Args:
        agent_id:      Identifier of the reporting agent (e.g. "AIPOT-SCRAPER")
        module:        Module name (e.g. "MODULE_A", "MODULE_D")
        day:           Day number within the module (1–6)
        status:        One of: "COMPLETE" | "IN_PROGRESS" | "BLOCKED"
        blocker:       Reason for BLOCKED, if applicable
        output_url:    URL to generated artefacts (optional)
        triggered_by:  Who or what triggered this agent run
        audit_type:    Audit context if this is a compliance run

    Returns:
        True if published successfully, False otherwise.
    """
    valid_statuses = {"COMPLETE", "IN_PROGRESS", "BLOCKED"}
    if status not in valid_statuses:
        logger.warning(
            f"[build_status] Invalid status '{status}' — "
            f"must be one of {valid_statuses}"
        )
        return False

    payload = {
        "agent_id": agent_id,
        "module": module,
        "day": day,
        "status": status,
        "timestamp": time.time(),
    }

    if blocker is not None:
        payload["blocker"] = blocker

    if output_url is not None:
        payload["output_url"] = output_url

    if triggered_by is not None:
        payload["triggered_by"] = triggered_by

    if audit_type is not None:
        payload["audit_type"] = audit_type

    try:
        producer = await get_kafka_producer()
        if producer is None:
            logger.warning("[build_status] Kafka producer unavailable — skipping publish")
            return False

        await producer.send("letese.build.status", payload)
        logger.info(
            f"[build_status] agent={agent_id} module={module} "
            f"day={day} status={status}"
        )
        return True

    except Exception as e:
        logger.error(f"[build_status] Publish failed: {e}")
        return False
