import logging
import sys
import uuid

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        fmt = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s | %(message)s',
            datefmt='%H:%M:%S'
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger

def new_run_id() -> str:
    return str(uuid.uuid4())[:8].upper()
