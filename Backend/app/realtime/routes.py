from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt

from app.config import settings
from app.realtime.connection_manager import manager

router = APIRouter(tags=["Realtime"])


def authenticate_websocket(websocket: WebSocket) -> str:
    """
    Reads JWT token from HttpOnly cookie.
    """
    token = websocket.cookies.get("access_token")
    if not token:
        raise ValueError("Missing access token cookie")

    if token.startswith("Bearer "):
        token = token.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid token") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise ValueError("Token missing subject")

    return str(user_id)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    try:
        user_id = authenticate_websocket(websocket)
    except ValueError:
        await websocket.close(code=1008)
        return

    await manager.connect(user_id, websocket)

    try:
        await manager.send_to_user(
            user_id,
            {
                "type": "system.connected",
                "module": "system",
                "userId": user_id,
                "payload": {
                    "message": "WebSocket connected successfully",
                },
            },
        )

        while True:
            message = await websocket.receive_json()
            action = message.get("action")

            if action == "ping":
                await websocket.send_json(
                    {
                        "type": "system.pong",
                        "module": "system",
                        "userId": user_id,
                        "payload": {"ok": True},
                    }
                )
                continue

            await websocket.send_json(
                {
                    "type": "system.ack",
                    "module": "system",
                    "userId": user_id,
                    "payload": {"receivedAction": action},
                }
            )

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
        try:
            await websocket.close()
        except Exception:
            pass