from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ModuleSpecResponse(BaseModel):
    id: str
    title: str
    phase_num: str
    order: int
    schema_version: int
    school: str | None = None


class ModuleDataResponse(BaseModel):
    module_id: str
    schema_version: int
    data: dict[str, Any]
    updated_at: datetime | None = None


class SnapshotResponse(BaseModel):
    id: UUID
    label: str | None
    created_at: datetime
