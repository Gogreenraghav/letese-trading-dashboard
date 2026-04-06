"""
LETESE● Y.js Collaboration Server
Manages Y.js document state persistence via WebSocket + REST.
Receives binary updates from Flutter WebView, stores in PostgreSQL.

WebSocket endpoint: ws://host/ws/editor/{doc_id}?token=<jwt>
REST save endpoint: POST /api/v1/documents/{doc_id}/save
"""

import asyncio
import json
import time
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Header
from pydantic import BaseModel

from app.db.database import get_db
from app.core.security import verify_jwt_token

router = APIRouter()


# ── Database Model ──────────────────────────────────────────────────────────

class YjsDocument(BaseModel):
    doc_id: str
    content: Optional[dict] = None
    yjs_state: Optional[bytes] = None
    updated_at: Optional[str] = None


# ── Connection Manager ────────────────────────────────────────────────────────

class YjsConnectionManager:
    """
    Manages Y.js WebSocket connections per document.
    Supports up to 3 concurrent editors per document (per blueprint).
    """

    MAX_USERS_PER_DOC = 3

    def __init__(self):
        # doc_id -> set of (WebSocket, user_info)
        self.connections: dict[str, set[tuple[WebSocket, dict]]] = {}
        # doc_id -> Y.js binary state
        self.states: dict[str, bytes] = {}
        # doc_id -> last persisted timestamp
        self.last_persist: dict[str, float] = {}

    def _connections_key(self, doc_id: str) -> set:
        if doc_id not in self.connections:
            self.connections[doc_id] = set()
        return self.connections[doc_id]

    async def connect(self, ws: WebSocket, doc_id: str, user_info: dict) -> bool:
        """Register a connection. Returns False if limit reached."""
        conns = self._connections_key(doc_id)
        if len(conns) >= self.MAX_USERS_PER_DOC:
            return False
        conns.add((ws, user_info))
        return True

    def disconnect(self, ws: WebSocket, doc_id: str) -> None:
        conns = self.connections.get(doc_id, set())
        # Remove the specific ws
        to_remove = [c for c in conns if c[0] == ws]
        for item in to_remove:
            conns.discard(item)
        if not conns:
            self.connections.pop(doc_id, None)

    async def broadcast(self, doc_id: str, message: bytes, exclude: Optional[WebSocket] = None) -> None:
        """Broadcast a Y.js update to all connections for a doc (except sender)."""
        conns = self.connections.get(doc_id, set())
        dead = []
        for ws, _ in conns:
            if ws is exclude:
                continue
            try:
                await ws.send_bytes(message)
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        for ws in dead:
            self.disconnect(ws, doc_id)

    def user_count(self, doc_id: str) -> int:
        return len(self.connections.get(doc_id, set()))

    def update_state(self, doc_id: str, state: bytes) -> None:
        self.states[doc_id] = state
        self.last_persist[doc_id] = time.time()

    def get_state(self, doc_id: str) -> Optional[bytes]:
        return self.states.get(doc_id)


yjs_manager = YjsConnectionManager()

# Persist interval (seconds)
PERSIST_INTERVAL = 30.0


# ── JWT Dependency ────────────────────────────────────────────────────────────

async def get_current_user(token: str = Header(..., alias="authorization")):
    """Extract and verify JWT from Authorization: Bearer <token> header."""
    if token.startswith("Bearer "):
        token = token[7:]
    payload = verify_jwt_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


# ── WebSocket Endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/editor/{doc_id}")
async def editor_websocket(
    ws: WebSocket,
    doc_id: str,
    token: str,  # query param: ?token=<jwt>
):
    """
    Y.js WebSocket endpoint for collaborative real-time editing.
    Protocol: Y.js binary sync protocol over WebSocket.

    Params:
        doc_id: Document identifier
        token:  JWT token for auth (query param)
    """
    # ── Auth ──────────────────────────────────────────────────────────────────
    try:
        payload = verify_jwt_token(token)
        if payload is None:
            await ws.close(code=4001, reason="Unauthorized")
            return
    except Exception:
        await ws.close(code=4001, reason="Invalid token")
        return

    user_info = {
        "user_id": payload.get("sub", "unknown"),
        "email":   payload.get("email", ""),
        "name":    payload.get("name", payload.get("email", "User")),
    }

    # ── Accept connection ──────────────────────────────────────────────────────
    await ws.accept()

    if not await yjs_manager.connect(ws, doc_id, user_info):
        await ws.close(code=4003, reason="Max users reached (3)")
        return

    # ── Send current state to new joiner ─────────────────────────────────────
    current_state = yjs_manager.get_state(doc_id)
    if current_state:
        try:
            await ws.send_bytes(current_state)
        except Exception:
            pass

    # Notify all about new user count
    await _broadcast_user_count(doc_id)

    # ── Message loop ─────────────────────────────────────────────────────────
    try:
        while True:
            raw = await ws.receive_bytes()
            # Store latest state
            yjs_manager.update_state(doc_id, raw)
            # Broadcast to all OTHER peers
            await yjs_manager.broadcast(doc_id, raw, exclude=ws)
            # Auto-persist if due
            await _auto_persist(doc_id)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        # Log and continue
        print(f"[YjsWS] Error doc={doc_id}: {e}")
    finally:
        yjs_manager.disconnect(ws, doc_id)
        await _broadcast_user_count(doc_id)


# ── REST Save Endpoint ────────────────────────────────────────────────────────

class DocumentSaveRequest(BaseModel):
    content:   Optional[dict] = None
    text:      Optional[str] = None
    html:      Optional[str] = None
    updatedAt: Optional[str] = None


@router.post("/api/v1/documents/{doc_id}/save")
async def save_document(
    doc_id: str,
    body: DocumentSaveRequest,
    authorization: str = Header(..., alias="authorization"),
):
    """
    Save document content + metadata to PostgreSQL.
    Called both from Flutter (auto-save) and from web editor JS.
    """
    user = await get_current_user(authorization)

    db = next(get_db())
    try:
        from app.models.document import Document  # noqa: auto-import
        from sqlalchemy import select

        stmt = select(Document).where(Document.id == doc_id)
        doc  = db.execute(stmt).scalar_one_or_none()

        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        if doc is None:
            # Create new document
            doc = Document(
                id=doc_id,
                title=f"Doc {doc_id}",
                content=body.content,
                html_content=body.html,
                plain_text=body.text,
                owner_id=user.get("sub"),
                updated_at=now,
            )
            db.add(doc)
        else:
            doc.content      = body.content
            doc.html_content = body.html
            doc.plain_text   = body.text
            doc.updated_at   = now

        db.commit()

        return {"status": "saved", "doc_id": doc_id, "updated_at": now}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")
    finally:
        db.close()


# ── Document Load Endpoint ────────────────────────────────────────────────────

@router.get("/api/v1/documents/{doc_id}")
async def get_document(
    doc_id: str,
    authorization: str = Header(..., alias="authorization"),
):
    """Load a document with its Y.js state."""
    user = await get_current_user(authorization)

    db = next(get_db())
    try:
        from app.models.document import Document  # noqa
        from sqlalchemy import select

        doc = db.execute(
            select(Document).where(Document.id == doc_id)
        ).scalar_one_or_none()

        if doc is None:
            raise HTTPException(status_code=404, detail="Document not found")

        # Check ownership or shared access
        # (Add additional ACL check here based on your auth model)

        return {
            "id":           doc.id,
            "title":        doc.title,
            "content":     doc.content,
            "html_content": getattr(doc, "html_content", None),
            "plain_text":   getattr(doc, "plain_text", None),
            "updated_at":   getattr(doc, "updated_at", None),
            "yjs_state":    yjs_manager.get_state(doc_id),  # binary, may be None
            "active_users": yjs_manager.user_count(doc_id),
        }
    finally:
        db.close()


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _auto_persist(doc_id: str) -> None:
    """Persist Y.js state to DB if interval elapsed."""
    last = yjs_manager.last_persist.get(doc_id, 0.0)
    if time.time() - last >= PERSIST_INTERVAL:
        state = yjs_manager.get_state(doc_id)
        if state:
            await _persist_to_db(doc_id, state)
            yjs_manager.last_persist[doc_id] = time.time()


async def _persist_to_db(doc_id: str, yjs_state: bytes) -> None:
    """Write Y.js binary state to yjs_documents table."""
    db = next(get_db())
    try:
        from sqlalchemy import text
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        db.execute(
            text("""
                INSERT INTO yjs_documents (doc_id, yjs_state, updated_at)
                VALUES (:doc_id, :yjs_state, :updated_at)
                ON CONFLICT (doc_id)
                DO UPDATE SET yjs_state = EXCLUDED.yjs_state,
                              updated_at = EXCLUDED.updated_at
            """),
            {"doc_id": doc_id, "yjs_state": yjs_state, "updated_at": now},
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[YjsPersist] Error: {e}")
    finally:
        db.close()


async def _broadcast_user_count(doc_id: str) -> None:
    """Notify all connected clients of current user count."""
    count = yjs_manager.user_count(doc_id)
    msg = json.dumps({"type": "user_count", "count": count}).encode()
    conns = yjs_manager.connections.get(doc_id, set())
    for ws, _ in list(conns):
        try:
            await ws.send_text(msg.decode())
        except Exception:
            pass