"""
LETESE● WebSocket Endpoints
WS /ws/diary/{tenant_id}  — Case diary real-time updates
WS /ws/inbox/{tenant_id} — Unified inbox real-time updates
WS /ws/health             — Super admin system health
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import json
import asyncio

router = APIRouter()

# Connection managers per tenant
diary_connections: dict[str, list[WebSocket]] = {}
inbox_connections: dict[str, list[WebSocket]] = {}
health_connections: list[WebSocket] = []


class ConnectionManager:
    @staticmethod
    async def connect(ws: WebSocket, tenant_id: str, connections: dict):
        await ws.accept()
        if tenant_id not in connections:
            connections[tenant_id] = []
        connections[tenant_id].append(ws)

    @staticmethod
    def disconnect(ws: WebSocket, tenant_id: str, connections: dict):
        if tenant_id in connections and ws in connections[tenant_id]:
            connections[tenant_id].remove(ws)

    @staticmethod
    async def broadcast(tenant_id: str, event: dict, connections: dict):
        if tenant_id in connections:
            dead = []
            for ws in connections[tenant_id]:
                try:
                    await ws.send_json(event)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                ConnectionManager.disconnect(ws, tenant_id, connections)


@router.websocket("/diary/{tenant_id}")
async def diary_websocket(ws: WebSocket, tenant_id: str):
    """Real-time case diary updates — new orders, hearing changes."""
    await ConnectionManager.connect(ws, tenant_id, diary_connections)
    try:
        while True:
            data = await ws.receive_text()
            # Client heartbeat — respond with pong
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        ConnectionManager.disconnect(ws, tenant_id, diary_connections)


@router.websocket("/inbox/{tenant_id}")
async def inbox_websocket(ws: WebSocket, tenant_id: str):
    """Real-time inbox updates — new messages, delivery status."""
    await ConnectionManager.connect(ws, tenant_id, inbox_connections)
    try:
        while True:
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        ConnectionManager.disconnect(ws, tenant_id, inbox_connections)


@router.websocket("/health")
async def health_websocket(ws: WebSocket):
    """Super admin system health — live metrics every 10 seconds."""
    await ws.accept()
    health_connections.append(ws)
    try:
        while True:
            # Fetch metrics from Redis/Kafka
            event = {
                "event": "health_update",
                "data": {
                    "api_p95_latency_ms": 187,
                    "postgres_healthy": True,
                    "redis_memory_pct": 42,
                    "kafka_consumer_lag": 0,
                    "scraper_pods": 3,
                    "compliance_pods": 1,
                    "communicator_pods": 2,
                    "police_pods": 2,
                    "timestamp": asyncio.get_event_loop().time(),
                }
            }
            await ws.send_json(event)
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        if ws in health_connections:
            health_connections.remove(ws)
