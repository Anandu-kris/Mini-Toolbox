from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.realtime.emitter import emit_user_event


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_day_key() -> str:
    return utc_now().strftime("%Y-%m-%d")


def serialize_notification(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "userId": str(doc["userId"]),
        "type": doc.get("type"),
        "title": doc.get("title"),
        "message": doc.get("message"),
        "severity": doc.get("severity", "info"),
        "read": doc.get("read", False),
        "createdAt": doc["createdAt"].isoformat() if doc.get("createdAt") else None,
        "updatedAt": doc["updatedAt"].isoformat() if doc.get("updatedAt") else None,
        "meta": doc.get("meta", {}) or {},
    }


async def create_notification(
    *,
    db,
    user_id: str,
    type: str,
    title: str,
    message: str,
    severity: str = "info",
    read: bool = False,
    meta: Optional[dict[str, Any]] = None,
    emit_realtime: bool = True,
) -> dict[str, Any]:
    now = utc_now()

    doc: dict[str, Any] = {
        "userId": str(user_id),
        "type": type,
        "title": title.strip(),
        "message": message.strip(),
        "severity": severity,
        "read": read,
        "createdAt": now,
        "updatedAt": now,
        "meta": meta or {},
    }

    result = await db.notifications.insert_one(doc)
    doc["_id"] = result.inserted_id

    payload = serialize_notification(doc)

    if emit_realtime:
        await emit_user_event(
            user_id=str(user_id),
            event_type="notification.created",
            module="notifications",
            payload=payload,
            meta=payload.get("meta", {}),
        )

    return payload


async def list_notifications(
    *,
    db,
    user_id: str,
    limit: int = 20,
    skip: int = 0,
    unread_only: bool = False,
) -> dict[str, Any]:
    limit = max(1, min(limit, 100))
    skip = max(0, skip)

    query: dict[str, Any] = {"userId": str(user_id)}
    if unread_only:
        query["read"] = False

    cursor = (
        db.notifications.find(query)
        .sort("createdAt", -1)
        .skip(skip)
        .limit(limit)
    )

    docs = await cursor.to_list(length=limit)
    total = await db.notifications.count_documents(query)
    unread_count = await db.notifications.count_documents(
        {"userId": str(user_id), "read": False}
    )

    return {
        "items": [serialize_notification(doc) for doc in docs],
        "total": total,
        "unreadCount": unread_count,
    }


async def get_unread_notification_count(*, db, user_id: str) -> int:
    return await db.notifications.count_documents(
        {"userId": str(user_id), "read": False}
    )


async def mark_notification_read(
    *,
    db,
    user_id: str,
    notification_id: str,
    emit_realtime: bool = True,
) -> dict[str, Any]:
    if not ObjectId.is_valid(notification_id):
        raise ValueError("Invalid notification id")

    oid = ObjectId(notification_id)
    now = utc_now()

    doc = await db.notifications.find_one_and_update(
        {
            "_id": oid,
            "userId": str(user_id),
        },
        {
            "$set": {
                "read": True,
                "updatedAt": now,
            }
        },
        return_document=True,
    )

    if not doc:
        raise LookupError("Notification not found")

    payload = serialize_notification(doc)

    if emit_realtime:
        await emit_user_event(
            user_id=str(user_id),
            event_type="notification.read",
            module="notifications",
            payload={"id": notification_id, "read": True, "updatedAt": payload["updatedAt"]},
            meta={},
        )

    return payload


async def mark_all_notifications_read(
    *,
    db,
    user_id: str,
    emit_realtime: bool = True,
) -> int:
    now = utc_now()

    result = await db.notifications.update_many(
        {
            "userId": str(user_id),
            "read": False,
        },
        {
            "$set": {
                "read": True,
                "updatedAt": now,
            }
        },
    )

    modified_count = result.modified_count

    if emit_realtime and modified_count > 0:
        await emit_user_event(
            user_id=str(user_id),
            event_type="notification.read_all",
            module="notifications",
            payload={
                "modifiedCount": modified_count,
                "updatedAt": now.isoformat(),
            },
            meta={},
        )

    return modified_count


async def emit_daily_welcome_if_needed(*, db, user_id: str) -> Optional[dict[str, Any]]:
    day_id = utc_day_key()
    now = utc_now()

    try:
        marker_result = await db.notification_delivery_markers.insert_one(
            {
                "userId": str(user_id),
                "dayId": day_id,
                "type": "daily_welcome",
                "notificationId": None,
                "createdAt": now,
            }
        )
    except DuplicateKeyError:
        return None

    created = await create_notification(
        db=db,
        user_id=str(user_id),
        type="daily_welcome",
        title="Welcome to MiniToolbox",
        message="Welcome to MiniToolbox, explore!",
        severity="info",
        read=False,
        meta={
            "kind": "daily_welcome",
            "dayId": day_id,
        },
        emit_realtime=True,
    )

    await db.notification_delivery_markers.update_one(
        {"_id": marker_result.inserted_id},
        {
            "$set": {
                "notificationId": created["id"],
            }
        },
    )

    return created