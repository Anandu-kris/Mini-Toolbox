import logging
import os
from logging.handlers import TimedRotatingFileHandler

from app.config import settings

log_file = settings.LOG_FILE
log_dir = os.path.dirname(log_file)

if log_dir and not os.path.exists(log_dir):
    os.makedirs(log_dir, exist_ok=True)

logger = logging.getLogger("mini-toolbox")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = TimedRotatingFileHandler(
        filename = log_file,
        when="midnight",
        interval=1,
        backupCount=90,
        utc=True,
        encoding="utf-8",
    )

    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    
logger.propagate = False