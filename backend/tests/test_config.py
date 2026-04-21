from __future__ import annotations

import logging

import pytest
from pydantic import ValidationError

_DEFAULT_TOKEN = "change-me-please"


def test_empty_token_rejected():
    from app.config import Settings

    with pytest.raises(ValidationError, match="must not be empty"):
        Settings(kompass_token="", database_url="sqlite:///./test.db")


def test_default_token_is_accepted():
    from app.config import Settings

    s = Settings(kompass_token=_DEFAULT_TOKEN, database_url="sqlite:///./test.db")
    assert s.kompass_token == _DEFAULT_TOKEN


async def test_default_token_warning(caplog):
    from app.main import app as fastapi_app
    from app.main import lifespan  # noqa: F401 — ImportError is expected until Plan 02

    with caplog.at_level(logging.WARNING, logger="app.main"):
        async with lifespan(fastapi_app):
            pass

    assert any(
        "change-me-please" in r.message
        for r in caplog.records
        if r.levelno >= logging.WARNING
    )
