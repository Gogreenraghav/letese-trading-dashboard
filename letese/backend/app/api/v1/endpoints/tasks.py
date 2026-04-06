"""
LETESE● Tasks Endpoints
GET    /api/v1/tasks          — List tasks
POST   /api/v1/tasks          — Create task
PATCH  /api/v1/tasks/{id}     — Update task (status, due_date)
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
from app.db.database import get_db
from app.services.auth_service import auth_service

router = APIRouter()


def get_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    return auth_service.verify_token(authorization[7:])


class TaskCreate(BaseModel):
    case_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: str = "medium"
    assigned_to: Optional[UUID] = None


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[UUID] = None


@router.get("")
async def list_tasks(
    status: Optional[str] = Query(None),
    due: Optional[str] = Query(None),  # today | upcoming | overdue
    assigned_to: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    from app.models.models import Task
    from sqlalchemy import func

    query = select(Task).where(
        and_(
            Task.tenant_id == UUID(user["tenant_id"]),
            Task.status != "cancelled",
        )
    )

    if status:
        query = query.where(Task.status == status)

    if due == "today":
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
        today_end = today_start.replace(hour=23, minute=59, second=59)
        query = query.where(Task.due_date >= today_start, Task.due_date <= today_end)
    elif due == "overdue":
        query = query.where(
            Task.due_date < datetime.now(timezone.utc),
            Task.status.in_(["pending", "in_progress"]),
        )
    elif due == "upcoming":
        query = query.where(
            Task.due_date > datetime.now(timezone.utc).replace(hour=23, minute=59),
            Task.status == "pending",
        )

    if assigned_to:
        query = query.where(Task.assigned_to == UUID(assigned_to))
    elif user["role"] not in ("admin", "super_admin"):
        query = query.where(Task.assigned_to == UUID(user["sub"]))

    query = query.order_by(Task.due_date.asc()).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return {
        "tasks": [
            {
                "task_id": str(t.task_id),
                "case_id": str(t.case_id) if t.case_id else None,
                "title": t.title,
                "description": t.description,
                "due_date": t.due_date.isoformat(),
                "priority": t.priority,
                "status": t.status,
                "source": t.source,
                "created_at": t.created_at.isoformat(),
            }
            for t in tasks
        ],
        "total": len(tasks),
    }


@router.post("")
async def create_task(
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    from app.models.models import Task

    if body.assigned_to:
        assigned = body.assigned_to
    elif user["role"] in ("admin", "advocate"):
        assigned = UUID(user["sub"])
    else:
        assigned = None

    task = Task(
        tenant_id=UUID(user["tenant_id"]),
        case_id=body.case_id,
        assigned_to=assigned,
        title=body.title,
        description=body.description,
        due_date=body.due_date,
        priority=body.priority,
        status="pending",
        source="manual",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return {
        "task_id": str(task.task_id),
        "title": task.title,
        "status": task.status,
        "due_date": task.due_date.isoformat(),
    }


@router.patch("/{task_id}")
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    from app.models.models import Task

    task = await db.get(Task, task_id)
    if not task or str(task.tenant_id) != user["tenant_id"]:
        raise HTTPException(404, "Task not found")

    if body.status:
        task.status = body.status
        if body.status == "completed":
            task.completed_at = datetime.now(timezone.utc)
    if body.due_date:
        task.due_date = body.due_date
    if body.assigned_to:
        task.assigned_to = body.assigned_to

    await db.commit()
    return {"message": "Task updated", "task_id": str(task_id)}
