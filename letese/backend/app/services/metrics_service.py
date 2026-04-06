"""
LETESE● Prometheus Metrics Service
Exposes system metrics in Prometheus format.
Used by: GET /metrics, AIPOT-POLICE for health checks.
"""
import time
import psutil
from typing import Dict, Any

# In-memory counters (in production, use Redis for persistence)
_metrics: Dict[str, Any] = {
    "requests_total": {},
    "request_duration_ms": {},
    "llm_requests_total": 0,
    "llm_cost_inr_total": 0.0,
    "cases_created_total": 0,
    "documents_uploaded_total": 0,
    "communications_sent_total": {},
}


async def get_metrics() -> Dict[str, Any]:
    """
    Returns all current metrics — used by /metrics endpoint.
    In production this would read from Redis + PostgreSQL.
    """
    # System metrics
    cpu_pct = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    # Process metrics
    process = psutil.Process()
    process_mem_mb = process.memory_info().rss / (1024 * 1024)

    return {
        # System
        "letese_system_cpu_percent": cpu_pct,
        "letese_system_memory_percent": mem.percent,
        "letese_system_memory_used_mb": round(mem.used / (1024**2), 1),
        "letese_system_disk_percent": disk.percent,
        "letese_process_memory_mb": round(process_mem_mb, 1),

        # Counters
        "letese_llm_requests_total": _metrics["llm_requests_total"],
        "letese_llm_cost_inr_total": round(_metrics["llm_cost_inr_total"], 4),
        "letese_cases_created_total": _metrics["cases_created_total"],
        "letese_documents_uploaded_total": _metrics["documents_uploaded_total"],

        # Timestamps
        "letese_uptime_seconds": int(time.time() - _start_time),
        "letese_scraped_at": int(time.time()),
    }


# Track start time
_start_time = time.time()


def increment_counter(name: str, labels: Dict[str, str] = None, value: int = 1):
    """Increment a counter metric."""
    key = name if not labels else f"{name}:{':'.join(f'{k}={v}' for k, v in (labels or {}).items())}"
    _metrics.setdefault(name, 0)
    _metrics[name] += value


def record_llm_call(provider: str, model: str, tokens: int, cost_inr: float):
    """Record an LLM API call."""
    _metrics["llm_requests_total"] += 1
    _metrics["llm_cost_inr_total"] += cost_inr


def record_case_created():
    _metrics["cases_created_total"] += 1


def record_document_uploaded():
    _metrics["documents_uploaded_total"] += 1


def record_communication(channel: str):
    if channel not in _metrics["communications_sent_total"]:
        _metrics["communications_sent_total"][channel] = 0
    _metrics["communications_sent_total"][channel] += 1
