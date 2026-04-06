"""
LETESE● Metrics Store
Thread-safe in-memory metrics store updated by middleware and background tasks.
Read by /metrics endpoint for Prometheus scraping.
"""
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any


@dataclass
class MetricsStore:
    """Global metrics registry — all counters/gauges stored here."""

    def __init__(self):
        self._lock = threading.Lock()

        # letese_api_requests_total{method, endpoint, status} — counter
        self.api_requests: dict[tuple, int] = defaultdict(int)

        # letese_api_request_duration_seconds{endpoint} — histogram
        # Structure: {endpoint: {"buckets": {le_value: count}, "sum": float, "count": int}}
        self.request_latencies: dict[str, dict] = defaultdict(
            lambda: {"buckets": defaultdict(int), "sum": 0.0, "count": 0}
        )

        # letese_kafka_consumer_lag{topic} — gauge
        self.kafka_consumer_lag: dict[tuple, float] = defaultdict(float)

        # letese_postgres_pool_used — gauge
        self.postgres_pool_used: dict[tuple, int] = defaultdict(int)

        # letese_redis_memory_bytes — gauge
        self.redis_memory_bytes: dict[tuple, int] = defaultdict(int)

        # letese_llm_requests_total{provider, model, task_type} — counter
        self.llm_requests_total: dict[tuple, int] = defaultdict(int)

        # letese_llm_cost_inr_total — counter
        self.llm_cost_inr_total: float = 0.0

        # letese_cases_active_total{tenant_id} — gauge
        self.cases_active_total: dict[tuple, int] = defaultdict(int)

        # letese_aipot_heartbeat_age_seconds{agent_id} — gauge
        self.aipot_heartbeat_age: dict[tuple, float] = defaultdict(float)

        # letese_aipot_processed_total{agent_id} — counter
        self.aipot_processed_total: dict[tuple, int] = defaultdict(int)

        # letese_aipot_errors_total{agent_id} — counter
        self.aipot_errors_total: dict[tuple, int] = defaultdict(int)

    # ── API Metrics ───────────────────────────────────────────────

    def record_request(self, method: str, endpoint: str, status: int, duration_s: float):
        """Record an API request and its latency."""
        with self._lock:
            self.api_requests[(method, endpoint, str(status))] += 1
            ep_data = self.request_latencies[endpoint]
            ep_data["count"] += 1
            ep_data["sum"] += duration_s
            # Standard histogram buckets (seconds)
            for le in (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, float("inf")):
                if duration_s <= le:
                    ep_data["buckets"][str(le)] += 1

    # ── Kafka Metrics ──────────────────────────────────────────────

    def set_kafka_consumer_lag(self, topic: str, lag: float):
        with self._lock:
            self.kafka_consumer_lag[(topic,)] = lag

    # ── Postgres Metrics ───────────────────────────────────────────

    def set_postgres_pool_used(self, pool_name: str, used: int):
        with self._lock:
            self.postgres_pool_used[(pool_name,)] = used

    # ── Redis Metrics ─────────────────────────────────────────────

    def set_redis_memory_bytes(self, host: str, bytes_used: int):
        with self._lock:
            self.redis_memory_bytes[(host,)] = bytes_used

    # ── LLM Metrics ───────────────────────────────────────────────

    def record_llm_request(self, provider: str, model: str, task_type: str, cost_inr: float = 0.0):
        with self._lock:
            self.llm_requests_total[(provider, model, task_type)] += 1
            self.llm_cost_inr_total += cost_inr

    # ── Case Metrics ──────────────────────────────────────────────

    def set_active_cases(self, tenant_id: str, count: int):
        with self._lock:
            self.cases_active_total[(tenant_id,)] = count

    # ── AIPOT Metrics ─────────────────────────────────────────────

    def record_aipot_heartbeat(self, agent_id: str, timestamp: float):
        with self._lock:
            self.aipot_heartbeat_age[(agent_id,)] = time.time() - timestamp

    def record_aipot_processed(self, agent_id: str):
        with self._lock:
            self.aipot_processed_total[(agent_id,)] += 1

    def record_aipot_error(self, agent_id: str):
        with self._lock:
            self.aipot_errors_total[(agent_id,)] += 1


# Global singleton
metrics_store = MetricsStore()
