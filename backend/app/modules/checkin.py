"""Checkin module — weekly PHQ-9 / GAD-7 check-in entries.

Reference pattern: values.py. Mirror the structure exactly:
  - Pydantic model for item shape
  - Pydantic model for module data
  - default_data() producing a fresh empty state
  - migrations dict keyed by target schema_version
  - a single SPEC exported at the bottom
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from .registry import ModuleSpec


class CheckinEntry(BaseModel):
    id: str
    timestamp: str
    phq9: list[int] = Field(default_factory=list)
    gad7: list[int] = Field(default_factory=list)
    note: str = ""


class CheckinData(BaseModel):
    entries: list[CheckinEntry] = Field(default_factory=list)


def default_data() -> dict[str, Any]:
    return CheckinData().model_dump(mode="json")


migrations: dict[int, Any] = {
    # 2: lambda d: {**d, "new_field": []},
}


SPEC = ModuleSpec(
    id="checkin",
    title="Wochen-Check-in",
    phase_num="W",
    order=5,
    schema_version=1,
    data_schema=CheckinData,
    default_data=default_data,
    migrations=migrations,
)
