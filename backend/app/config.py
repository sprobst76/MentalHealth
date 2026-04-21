from __future__ import annotations

import logging

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

_DEFAULT_TOKEN = "change-me-please"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    kompass_token: str = _DEFAULT_TOKEN
    database_url: str = "sqlite:///./kompass.db"
    cors_origins: str = "http://localhost:5173"

    @field_validator("kompass_token", mode="after")
    @classmethod
    def token_must_not_be_empty(cls, v: str) -> str:
        if v == "":
            raise ValueError(
                "KOMPASS_TOKEN must not be empty. "
                "Set a token or use the default 'change-me-please' for local dev."
            )
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
