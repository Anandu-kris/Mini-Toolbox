from __future__ import annotations

from datetime import datetime, timezone

from app.realtime.emitter import emit_user_event


def utc_day_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def emit_daily_welcome_if_needed(*, db, user_id: str) -> None:
    day_id = utc_day_key()

    existing = await db.notification_delivery_markers.find_one(
        {
            "userId": user_id,
            "dayId": day_id,
            "type": "daily_welcome",
        }
    )
    if existing:
        return

    now = datetime.now(timezone.utc)

    await db.notification_delivery_markers.insert_one(
        {
            "userId": user_id,
            "dayId": day_id,
            "type": "daily_welcome",
            "createdAt": now,
        }
    )

    await emit_user_event(
        user_id=str(user_id),
        event_type="notification.created",
        module="notifications",
        payload={
            "id": f"daily_welcome_{user_id}_{day_id}",
            "title": "Welcome to MiniToolbox",
            "message": "Welcome to MiniToolbox, explore!",
            "createdAt": now.isoformat(),
            "read": False,
            "severity": "info",
        },
        meta={
            "kind": "daily_welcome",
            "dayId": day_id,
        },
    )