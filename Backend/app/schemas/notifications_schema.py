from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


NotificationSeverity = Literal["info", "success", "warning", "error"]


class NotificationsBaseSchema(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
    )


class NotificationMeta(NotificationsBaseSchema):
    kind: Optional[str] = None
    dayId: Optional[str] = None
    source: Optional[str] = None
    extra: Optional[dict[str, Any]] = None


class NotificationItem(NotificationsBaseSchema):
    id: str
    userId: str
    type: str
    title: str = Field(..., min_length=1, max_length=160)
    message: str = Field(..., min_length=1, max_length=1000)
    severity: NotificationSeverity = "info"
    read: bool = False
    createdAt: datetime
    updatedAt: datetime
    meta: dict[str, Any] = Field(default_factory=dict)


class NotificationsListResponse(NotificationsBaseSchema):
    items: list[NotificationItem]
    total: int
    unreadCount: int


class NotificationUnreadCountResponse(NotificationsBaseSchema):
    unreadCount: int


class MarkNotificationReadResponse(NotificationsBaseSchema):
    message: str
    item: NotificationItem


class MarkAllNotificationsReadResponse(NotificationsBaseSchema):
    message: str
    modifiedCount: int


class NotificationCreate(NotificationsBaseSchema):
    userId: str
    type: str
    title: str = Field(..., min_length=1, max_length=160)
    message: str = Field(..., min_length=1, max_length=1000)
    severity: NotificationSeverity = "info"
    read: bool = False
    meta: dict[str, Any] = Field(default_factory=dict)


class NotificationDeliveryMarkerCreate(NotificationsBaseSchema):
    userId: str
    dayId: str
    type: str
    notificationId: Optional[str] = None
    createdAt: datetime