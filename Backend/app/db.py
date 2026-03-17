from datetime import timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.scripts.seed_wordle import seed_wordle_if_empty


async def connect_to_mongo(app):
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        tz_aware=True,
        tzinfo=timezone.utc,
    )
    await client.admin.command("ping")

    app.state.mongo_client = client
    app.state.db = client[settings.DB_NAME]

    # Auth / Users indexes
    await app.state.db.users.create_index("emailLower", unique=True, sparse=True)
    await app.state.db.users.create_index("mobileNumberE164", unique=True, sparse=True)
    await app.state.db.users.create_index(
        "oauthProviders.google.providerUserId",
        sparse=True,
    )

    await app.state.db.otp_challenges.create_index("expiresAt", expireAfterSeconds=0)
    await app.state.db.otp_challenges.create_index(
        [("mobileNumberE164", 1), ("purpose", 1), ("createdAt", -1)]
    )

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

    # Wordle indexes
    await app.state.db.wordle_answers.create_index([("word", 1)], unique=True)
    await app.state.db.wordle_allowed.create_index([("word", 1)], unique=True)
    await app.state.db.wordle_answers.create_index([("length", 1), ("word", 1)])
    await app.state.db.wordle_allowed.create_index([("length", 1), ("word", 1)])
    await app.state.db.wordle_games.create_index([("userEmail", 1), ("dayId", 1)], unique=True)
    await app.state.db.wordle_stats.create_index([("userEmail", 1)], unique=True)
    await app.state.db.wordle_games.create_index([("userEmail", 1), ("status", 1)])

    await seed_wordle_if_empty(app.state.db)

    # Finance manager indexes
    await app.state.db.finance_accounts.create_index([("userEmail", 1), ("createdAt", -1)])
    await app.state.db.finance_accounts.create_index([("userEmail", 1), ("isActive", 1)])
    await app.state.db.finance_accounts.create_index([("userEmail", 1), ("type", 1)])

    await app.state.db.finance_categories.create_index(
        [("userEmail", 1), ("type", 1), ("name", 1)],
        unique=True,
    )
    await app.state.db.finance_categories.create_index([("userEmail", 1), ("isActive", 1)])

    await app.state.db.finance_transactions.create_index([("userEmail", 1), ("transactionDate", -1)])
    await app.state.db.finance_transactions.create_index([("userEmail", 1), ("type", 1), ("transactionDate", -1)])
    await app.state.db.finance_transactions.create_index([("userEmail", 1), ("accountId", 1), ("transactionDate", -1)])
    await app.state.db.finance_transactions.create_index([("userEmail", 1), ("toAccountId", 1), ("transactionDate", -1)])
    await app.state.db.finance_transactions.create_index([("userEmail", 1), ("categoryId", 1), ("transactionDate", -1)])
    await app.state.db.finance_transactions.create_index([("userEmail", 1), ("merchant", 1)])
    await app.state.db.finance_transactions.create_index([("userEmail", 1), ("paymentMethod", 1)])
    await app.state.db.finance_transactions.create_index([("userEmail", 1), ("createdAt", -1)])

    await app.state.db.finance_budgets.create_index([("userEmail", 1), ("createdAt", -1)])
    await app.state.db.finance_budgets.create_index([("userEmail", 1), ("categoryId", 1), ("isActive", 1)])
    await app.state.db.finance_budgets.create_index([("userEmail", 1), ("startDate", 1), ("endDate", 1)])


async def close_mongo_connection(app):
    client = getattr(app.state, "mongo_client", None)
    if client:
        client.close()