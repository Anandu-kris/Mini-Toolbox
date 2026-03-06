from time import perf_counter
from fastapi import Request
from app.core.logger import logger

async def log_requests(request: Request, call_next):
    start = perf_counter()
    response = await call_next(request)
    ms = (perf_counter() - start) * 1000

    size = response.headers.get("content-length", "?")

    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} "
        f"({ms:.1f}ms, bytes={size})"
    )

    response.headers["Server-Timing"] = f"app;dur={ms:.1f}"
    return response