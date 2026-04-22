from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import _DEFAULT_TOKEN, settings
from .routers import health, modules, portability

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    if settings.kompass_token == _DEFAULT_TOKEN:
        logger.warning(
            "KOMPASS_TOKEN is set to the default value '%s'. "
            "Change it before any network-accessible deployment.",
            _DEFAULT_TOKEN,
        )
    yield


app = FastAPI(title="Kompass", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(modules.router)
app.include_router(portability.router)
