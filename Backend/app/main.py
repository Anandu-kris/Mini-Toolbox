from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import settings
from app.core.redis import init_redis, close_redis

from app.db import connect_to_mongo, close_mongo_connection
from app.routes.url import router as urls_router, redirect_router
from app.routes.auth import router as auth_router
from app.routes.oauth_google import router as oauth_google_router
from app.routes.notes import router as notes_router
from app.routes.tasks import router as tasks_router
from app.routes.passlock import router as passlock_router
from app.routes.vault_items import router as vault_items
from app.routes.health import router as health_router
from app.routes.ai_notes import router as ai_router
from app.routes.wordle import router as wordle_router
from app.middleware.logging import log_requests
from fastapi.middleware.gzip import GZipMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    await connect_to_mongo(app)
    print(">> DB attached:", hasattr(app.state, "db"))

    await init_redis()
    print(">> Redis attached: True")

    try:
        yield
    finally:
        # shutdown
        await close_redis()
        await close_mongo_connection(app)


app = FastAPI(title="Mini ToolBox", lifespan=lifespan)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    same_site="lax",
    https_only=False,
)

app.middleware("http")(log_requests)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(urls_router)
app.include_router(redirect_router)
app.include_router(auth_router)
app.include_router(oauth_google_router)
app.include_router(notes_router)
app.include_router(tasks_router)
app.include_router(passlock_router)
app.include_router(vault_items)
app.include_router(health_router)
app.include_router(ai_router)
app.include_router(wordle_router)
