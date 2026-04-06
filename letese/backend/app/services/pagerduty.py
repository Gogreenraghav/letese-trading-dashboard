"""
LETESE● PagerDuty Service
Wraps PagerDuty Events API v2 for triggering and resolving alerts.
Used by AIPOT-POLICE and background alerting tasks.
"""
import hashlib
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

PAGERDUTY_EVENTS_URL = "https://events.pagerduty.com/v2/enqueue"
ROUTING_KEY = os.environ.get("PAGERDUTY_ROUTING_KEY", "")

# PagerDuty severity mapping
SEVERITY_MAP = {
    "P1": "critical",
    "P2": "error",
    "P3": "warning",
    "P4": "info",
}


async def send_alert(
    severity: str,
    summary: str,
    source: str = "LETESE",
    details: Optional[dict] = None,
    dedup_key: Optional[str] = None,
    routing_key: Optional[str] = None,
) -> bool:
    """
    Send a new alert to PagerDuty Events API v2.

    Args:
        severity:     P1 | P2 | P3 | P4
        summary:      Human-readable alert summary (first 1024 chars)
        source:      Component or service name originating the alert
        details:     Arbitrary key/value pairs appended to the alert payload
        dedup_key:   Optional deduplication key (auto-generated if omitted)
        routing_key: Override PAGERDUTY_ROUTING_KEY env var

    Returns:
        True if the HTTP request succeeded, False otherwise.
    """
    key = routing_key or ROUTING_KEY
    if not key:
        logger.warning("[PAGERDUTY] No routing key configured — skipping alert")
        return False

    if dedup_key is None:
        # Auto-generate stable dedup key from summary + severity
        raw = f"{severity}:{summary}"
        dedup_key = hashlib.sha256(raw.encode()).hexdigest()[:64]

    payload = {
        "routing_key": key,
        "event_action": "trigger",
        "dedup_key": dedup_key,
        "payload": {
            "summary": summary[:1024],
            "severity": SEVERITY_MAP.get(severity, "warning"),
            "source": source,
            "custom_details": details or {},
            "group": "letese-platform",
            "class": "platform-alert",
        },
        "images": [],
        "links": [],
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
            response = await client.post(PAGERDUTY_EVENTS_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            logger.info(
                f"[PAGERDUTY] Alert sent — dedup_key={dedup_key} "
                f"status={result.get('status')} message={result.get('message', '')}"
            )
            return True
    except httpx.HTTPStatusError as e:
        logger.error(f"[PAGERDUTY] HTTP error {e.response.status_code}: {e.response.text[:200]}")
        return False
    except httpx.RequestError as e:
        logger.error(f"[PAGERDUTY] Request error: {e}")
        return False
    except Exception as e:
        logger.error(f"[PAGERDUTY] Unexpected error: {e}")
        return False


async def resolve_alert(
    dedup_key: str,
    routing_key: Optional[str] = None,
) -> bool:
    """
    Resolve an active PagerDuty alert by dedup_key.

    Args:
        dedup_key:   The deduplication key of the alert to resolve
        routing_key: Override PAGERDUTY_ROUTING_KEY env var

    Returns:
        True if the HTTP request succeeded, False otherwise.
    """
    key = routing_key or ROUTING_KEY
    if not key:
        logger.warning("[PAGERDUTY] No routing key configured — skipping resolve")
        return False

    payload = {
        "routing_key": key,
        "event_action": "resolve",
        "dedup_key": dedup_key,
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
            response = await client.post(PAGERDUTY_EVENTS_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            logger.info(
                f"[PAGERDUTY] Resolve sent — dedup_key={dedup_key} "
                f"status={result.get('status')} message={result.get('message', '')}"
            )
            return True
    except httpx.HTTPStatusError as e:
        logger.error(f"[PAGERDUTY] HTTP error {e.response.status_code}: {e.response.text[:200]}")
        return False
    except httpx.RequestError as e:
        logger.error(f"[PAGERDUTY] Request error: {e}")
        return False
    except Exception as e:
        logger.error(f"[PAGERDUTY] Unexpected error: {e}")
        return False


# Convenience wrappers used by AIPOT-POLICE

async def page_p1(summary: str, source: str = "AIPOT-POLICE", details: Optional[dict] = None) -> bool:
    """Send a P1 (critical) page."""
    return await send_alert("P1", summary, source, details)


async def page_p2(summary: str, source: str = "AIPOT-POLICE", details: Optional[dict] = None) -> bool:
    """Send a P2 (error) page."""
    return await send_alert("P2", summary, source, details)


async def page_p3(summary: str, source: str = "AIPOT-POLICE", details: Optional[dict] = None) -> bool:
    """Send a P3 (warning) page."""
    return await send_alert("P3", summary, source, details)
