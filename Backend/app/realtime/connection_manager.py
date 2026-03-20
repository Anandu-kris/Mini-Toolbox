from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import DefaultDict, Dict, Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._user_connections: DefaultDict[str, Set[WebSocket]] = defaultdict(set)
        self._socket_to_user: Dict[WebSocket, str] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._user_connections[user_id].add(websocket)
            self._socket_to_user[websocket] = user_id

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            user_id = self._socket_to_user.pop(websocket, None)
            if not user_id:
                return

            sockets = self._user_connections.get(user_id)
            if sockets:
                sockets.discard(websocket)
                if not sockets:
                    self._user_connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, message: dict) -> None:

        sockets = list(self._user_connections.get(user_id, set()))
        if not sockets:
            return

        stale_sockets: list[WebSocket] = []

        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:
                stale_sockets.append(ws)

        for ws in stale_sockets:
            await self.disconnect(ws)

    async def broadcast_all(self, message: dict) -> None:
        user_ids = list(self._user_connections.keys())
        for user_id in user_ids:
            await self.send_to_user(user_id, message)

    def is_user_online(self, user_id: str) -> bool:
        return bool(self._user_connections.get(user_id))

    def connection_count_for_user(self, user_id: str) -> int:
        return len(self._user_connections.get(user_id, set()))

    def total_users_online(self) -> int:
        return len(self._user_connections)

    def total_connections(self) -> int:
        return sum(len(sockets) for sockets in self._user_connections.values())


manager = ConnectionManager()