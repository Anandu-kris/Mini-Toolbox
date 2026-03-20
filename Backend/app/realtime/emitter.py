from __future__ import annotations

from app.realtime.pubsub import realtime_pubsub


async def emit_user_event(
    *,
    user_id: str,
    event_type: str,
    module: str,
    payload: dict,
    meta: dict | None = None,
) -> None:
    await realtime_pubsub.publish_user_event(
        user_id=user_id,
        event_type=event_type,
        module=module,
        payload=payload,
        meta=meta,
    )