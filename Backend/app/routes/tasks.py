from fastapi import APIRouter, Depends, HTTPException, Request, Query
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId

from app.schemas.tasks_schema import TaskCreate, TaskUpdate, TaskOut, TaskStatus
from app.deps.auth_deps import get_current_user_email
from app.core.logger import logger

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        logger.error("DB not ready: request.app.state.db missing")
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


def to_task_out(doc) -> TaskOut:
    return TaskOut(
        id=str(doc["_id"]),
        title=doc["title"],
        note=doc.get("note", ""),
        dueAt=doc.get("dueAt"),
        status=doc.get("status", "todo"),
        createdAt=doc["createdAt"],
        updatedAt=doc["updatedAt"],
    )


@router.post("/create", response_model=TaskOut)
async def create_task(
    payload: TaskCreate,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    now = datetime.now(timezone.utc)

    logger.info(
        f"[TASKS] create_task user={email} "
        f"title_len={len(payload.title or '')} status={payload.status} dueAt={'yes' if payload.dueAt else 'no'}"
    )

    doc = {
        "userEmail": email,
        "title": (payload.title or "Untitled task").strip(),
        "note": payload.note or "",
        "dueAt": payload.dueAt,
        "status": payload.status,
        "createdAt": now,
        "updatedAt": now,
    }

    res = await db.tasks.insert_one(doc)
    doc["_id"] = res.inserted_id

    logger.info(f"[TASKS] created task_id={doc['_id']} user={email}")
    return to_task_out(doc)


@router.get("", response_model=List[TaskOut])
async def list_tasks(
    request: Request,
    db=Depends(get_db),
    limit: int = Query(200, ge=1, le=500),
    skip: int = Query(0, ge=0),
    q: Optional[str] = Query(None, description="Search in title/note"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
):
    email = get_current_user_email(request)

    logger.info(
        f"[TASKS] list_tasks user={email} limit={limit} skip={skip} "
        f"q={'yes' if q else 'no'} status={status}"
    )

    filt = {"userEmail": email}

    if status:
        filt["status"] = status

    if q:
        qq = q.strip()
        if qq:
            filt["$or"] = [
                {"title": {"$regex": qq, "$options": "i"}},
                {"note": {"$regex": qq, "$options": "i"}},
            ]

    cursor = (
        db.tasks.find(filt)
        .sort([("updatedAt", -1)])
        .skip(skip)
        .limit(limit)
    )

    items = await cursor.to_list(length=limit)
    logger.info(f"[TASKS] list_tasks user={email} returned={len(items)}")
    return [to_task_out(d) for d in items]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: str,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    logger.info(f"[TASKS] get_task user={email} task_id={task_id}")

    try:
        oid = ObjectId(task_id)
    except Exception:
        logger.warning(f"[TASKS] get_task invalid task_id={task_id} user={email}")
        raise HTTPException(status_code=400, detail="Invalid task id")

    doc = await db.tasks.find_one({"_id": oid, "userEmail": email})
    if not doc:
        logger.warning(f"[TASKS] get_task not found task_id={task_id} user={email}")
        raise HTTPException(status_code=404, detail="Task not found")

    return to_task_out(doc)


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    logger.info(f"[TASKS] update_task user={email} task_id={task_id}")

    try:
        oid = ObjectId(task_id)
    except Exception:
        logger.warning(f"[TASKS] update_task invalid task_id={task_id} user={email}")
        raise HTTPException(status_code=400, detail="Invalid task id")

    update = {}

    if payload.title is not None:
        update["title"] = payload.title.strip()
    if payload.note is not None:
        update["note"] = payload.note
    if payload.status is not None:
        update["status"] = payload.status

    if payload.dueAt is not None:
        update["dueAt"] = payload.dueAt
    elif payload.dueAt is None and "dueAt" in payload.model_fields_set:
        update["dueAt"] = None

    if not update:
        logger.warning(f"[TASKS] update_task no fields user={email} task_id={task_id}")
        raise HTTPException(status_code=400, detail="No fields to update")

    update["updatedAt"] = datetime.now(timezone.utc)

    logger.info(
        f"[TASKS] update_task apply user={email} task_id={task_id} fields={list(update.keys())}"
    )

    res = await db.tasks.find_one_and_update(
        {"_id": oid, "userEmail": email},
        {"$set": update},
        return_document=True,
    )

    if not res:
        logger.warning(f"[TASKS] update_task not found user={email} task_id={task_id}")
        raise HTTPException(status_code=404, detail="Task not found")

    logger.info(f"[TASKS] update_task success user={email} task_id={task_id}")
    return to_task_out(res)


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    logger.info(f"[TASKS] delete_task user={email} task_id={task_id}")

    try:
        oid = ObjectId(task_id)
    except Exception:
        logger.warning(f"[TASKS] delete_task invalid task_id={task_id} user={email}")
        raise HTTPException(status_code=400, detail="Invalid task id")

    res = await db.tasks.delete_one({"_id": oid, "userEmail": email})
    if res.deleted_count == 0:
        logger.warning(f"[TASKS] delete_task not found user={email} task_id={task_id}")
        raise HTTPException(status_code=404, detail="Task not found")

    logger.info(f"[TASKS] delete_task success user={email} task_id={task_id}")
    return {"ok": True}