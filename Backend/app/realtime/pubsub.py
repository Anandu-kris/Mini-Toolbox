from __future__ import annotations

import asyncio
import contextlib
import json
from typing import Optional

import redis.asyncio as redis

from app.config import settings
from app.realtime.connection_manager import manager
from app.realtime.schemas import RealtimeEvent


REDIS_CHANNEL_USER_EVENTS = "realtime:user_events"


class RedisRealtimePubSub:
    def __init__(self) -> None:
        self._redis: Optional[redis.Redis] = None
        self._subscriber_task: Optional[asyncio.Task] = None

    def get_client(self) -> redis.Redis:
        if self._redis is None:
            self._redis = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
            )
        return self._redis

    async def publish_user_event(
        self,
        *,
        user_id: str,
        event_type: str,
        module: str,
        payload: dict,
        meta: dict | None = None,
    ) -> None:

        event = RealtimeEvent(
            userId=user_id,
            type=event_type,
            module=module,
            payload=payload,
            meta=meta,
        )

        redis_client = self.get_client()
        await redis_client.publish(
            REDIS_CHANNEL_USER_EVENTS,
            event.model_dump_json(),
        )

    async def _subscriber_loop(self) -> None:
        redis_client = self.get_client()
        pubsub = redis_client.pubsub()

        await pubsub.subscribe(REDIS_CHANNEL_USER_EVENTS)

        try:
            async for message in pubsub.listen():
                if message.get("type") != "message":
                    continue

                raw_data = message.get("data")
                if not raw_data:
                    continue

                try:
                    data = json.loads(raw_data)
                    user_id = data.get("userId")
                    if not user_id:
                        continue

                    await manager.send_to_user(user_id, data)
                except Exception as exc:
                    print(f"[Realtime Redis Subscriber] Failed to process message: {exc}")
        finally:
            with contextlib.suppress(Exception):
                await pubsub.unsubscribe(REDIS_CHANNEL_USER_EVENTS)
            with contextlib.suppress(Exception):
                await pubsub.close()

    async def start(self) -> None:
        if self._subscriber_task and not self._subscriber_task.done():
            return
        self._subscriber_task = asyncio.create_task(self._subscriber_loop())
        print("[Realtime Redis Subscriber] started")

    async def stop(self) -> None:
        if self._subscriber_task:
            self._subscriber_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._subscriber_task
            self._subscriber_task = None
            print("[Realtime Redis Subscriber] stopped")

        if self._redis:
            await self._redis.close()
            self._redis = None


realtime_pubsub = RedisRealtimePubSub()