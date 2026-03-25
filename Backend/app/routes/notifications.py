from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.deps.auth_deps import get_current_user_id
from app.schemas.notifications_schema import (
    MarkAllNotificationsReadResponse,
    MarkNotificationReadResponse,
    NotificationUnreadCountResponse,
    NotificationsListResponse,
)
from app.services.notifications_service import (
    get_unread_notification_count,
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)


router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


@router.get("", response_model=NotificationsListResponse)
async def get_notifications(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    unreadOnly: bool = Query(default=False),
    current_user_id: str = Depends(get_current_user_id),
):
    db = get_db(request)

    data = await list_notifications(
        db=db,
        user_id=str(current_user_id),
        limit=limit,
        skip=skip,
        unread_only=unreadOnly,
    )
    return data


@router.get("/unread-count", response_model=NotificationUnreadCountResponse)
async def get_notifications_unread_count(
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
):
    db = get_db(request)

    unread_count = await get_unread_notification_count(
        db=db,
        user_id=str(current_user_id),
    )
    return {"unreadCount": unread_count}


@router.post("/{notification_id}/read", response_model=MarkNotificationReadResponse)
async def read_notification(
    notification_id: str,
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
):
    db = get_db(request)

    try:
        item = await mark_notification_read(
            db=db,
            user_id=str(current_user_id),
            notification_id=notification_id,
            emit_realtime=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {
        "message": "Notification marked as read",
        "item": item,
    }


@router.post("/read-all", response_model=MarkAllNotificationsReadResponse)
async def read_all_notifications(
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
):
    db = get_db(request)

    modified_count = await mark_all_notifications_read(
        db=db,
        user_id=str(current_user_id),
        emit_realtime=True,
    )

    return {
        "message": "All notifications marked as read",
        "modifiedCount": modified_count,
    }