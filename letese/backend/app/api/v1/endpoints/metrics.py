"""
LETESE● Prometheus Metrics Endpoint
GET /metrics — Prometheus-compatible metrics scrape target.
Exposes all LETESE-specific metrics for Prometheus scraping.
"""
from fastapi import APIRouter, Response
from app.services.metrics_store import metrics_store

router = APIRouter(prefix="", tags=["Metrics"])


@router.get("/metrics")
async def metrics():
    """
    Prometheus-compatible /metrics endpoint.
    Returns metrics in Prometheus text exposition format.
    """
    lines = [
        "# HELP letese_api_requests_total Total number of API requests",
        "# TYPE letese_api_requests_total counter",
    ]

    # API requests
    for (method, endpoint, status), total in metrics_store.api_requests.items():
        lines.append(f'letese_api_requests_total{{method="{method}",endpoint="{endpoint}",status="{status}"}} {total}')

    lines.extend([
        "# HELP letese_api_request_duration_seconds API request duration in seconds",
        "# TYPE letese_api_request_duration_seconds histogram",
    ])

    # API latency histogram
    for endpoint, data in metrics_store.request_latencies.items():
        for bucket, count in data.get("buckets", {}).items():
            lines.append(f'letese_api_request_duration_seconds_bucket{{endpoint="{endpoint}",le="{bucket}"}} {count}')
        lines.append(f'letese_api_request_duration_seconds_sum{{endpoint="{endpoint}"}} {data.get("sum", 0)}')
        lines.append(f'letese_api_request_duration_seconds_count{{endpoint="{endpoint}"}} {data.get("count", 0)}')

    lines.extend([
        "# HELP letese_kafka_consumer_lag Kafka consumer lag by topic",
        "# TYPE letese_kafka_consumer_lag gauge",
    ])
    for (topic,), lag in metrics_store.kafka_consumer_lag.items():
        lines.append(f'letese_kafka_consumer_lag{{topic="{topic}"}} {lag}')

    lines.extend([
        "# HELP letese_postgres_pool_used PostgreSQL connection pool usage",
        "# TYPE letese_postgres_pool_used gauge",
    ])
    for (pool_name,), used in metrics_store.postgres_pool_used.items():
        lines.append(f'letese_postgres_pool_used{{pool="{pool_name}"}} {used}')

    lines.extend([
        "# HELP letese_redis_memory_bytes Redis memory usage in bytes",
        "# TYPE letese_redis_memory_bytes gauge",
    ])
    for (host,), mem in metrics_store.redis_memory_bytes.items():
        lines.append(f'letese_redis_memory_bytes{{host="{host}"}} {mem}')

    lines.extend([
        "# HELP letese_llm_requests_total Total LLM API requests",
        "# TYPE letese_llm_requests_total counter",
    ])
    for (provider, model, task_type), total in metrics_store.llm_requests_total.items():
        lines.append(f'letese_llm_requests_total{{provider="{provider}",model="{model}",task_type="{task_type}"}} {total}')

    lines.extend([
        "# HELP letese_llm_cost_inr_total Total LLM cost in INR",
        "# TYPE letese_llm_cost_inr_total counter",
    ])
    lines.append(f"letese_llm_cost_inr_total {metrics_store.llm_cost_inr_total}")

    lines.extend([
        "# HELP letese_cases_active_total Number of active cases per tenant",
        "# TYPE letese_cases_active_total gauge",
    ])
    for (tenant_id,), count in metrics_store.cases_active_total.items():
        lines.append(f'letese_cases_active_total{{tenant_id="{tenant_id}"}} {count}')

    lines.extend([
        "# HELP letese_aipot_heartbeat_age_seconds Seconds since each AIPOT's last heartbeat",
        "# TYPE letese_aipot_heartbeat_age_seconds gauge",
    ])
    for (agent_id,), age in metrics_store.aipot_heartbeat_age.items():
        lines.append(f'letese_aipot_heartbeat_age_seconds{{agent_id="{agent_id}"}} {age}')

    lines.extend([
        "# HELP letese_aipot_processed_total Total messages processed by AIPOT",
        "# TYPE letese_aipot_processed_total counter",
    ])
    for (agent_id,), total in metrics_store.aipot_processed_total.items():
        lines.append(f'letese_aipot_processed_total{{agent_id="{agent_id}"}} {total}')

    lines.extend([
        "# HELP letese_aipot_errors_total Total errors per AIPOT",
        "# TYPE letese_aipot_errors_total counter",
    ])
    for (agent_id,), total in metrics_store.aipot_errors_total.items():
        lines.append(f'letese_aipot_errors_total{{agent_id="{agent_id}"}} {total}')

    return Response(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4; charset=utf-8")
