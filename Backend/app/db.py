from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from datetime import timezone

async def connect_to_mongo(app):
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        tz_aware=True,
        tzinfo=timezone.utc
    )
    await client.admin.command("ping")
    app.state.mongo_client = client
    app.state.db = client[settings.DB_NAME]

    # Url Shortner Indexes
    await app.state.db.urls.create_index("expiresAt", expireAfterSeconds=0)
    await app.state.db.urls.create_index("shortId", unique=True)
    await app.state.db.urls.create_index("longUrl")

    # Notes Indexes
    await app.state.db.notes.create_index([("userEmail", 1), ("updatedAt", -1)])
    await app.state.db.notes.create_index([("userEmail", 1), ("pinned", -1), ("updatedAt", -1)])
    await app.state.db.notes.create_index([("userEmail", 1), ("tags", 1)])

    # Tasks Indexes (Kanban)
    await app.state.db.tasks.create_index([("userEmail", 1), ("updatedAt", -1)])
    await app.state.db.tasks.create_index([("userEmail", 1), ("status", 1), ("updatedAt", -1)])
    await app.state.db.tasks.create_index([("userEmail", 1), ("dueAt", 1)])

    # 4) Optional: if you add tags/labels later
    # await app.state.db.tasks.create_index([("userEmail", 1), ("tags", 1)])


async def close_mongo_connection(app):
    client = getattr(app.state, "mongo_client", None)
    if client:
        client.close()