"""Orientation module — situation-based intake questionnaire.

48 items across 6 life domains. Responses are scored to derive value
priorities and schema patterns, which seed the other modules.
"""
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field
from .registry import ModuleSpec


class ItemResponse(BaseModel):
    item_id: str
    rating: int = Field(ge=1, le=5)


class OrientationData(BaseModel):
    responses: list[ItemResponse] = Field(default_factory=list)


def default_data() -> dict[str, Any]:
    return OrientationData().model_dump(mode="json")


SPEC = ModuleSpec(
    id="orientation",
    title="Orientierung",
    phase_num="00",
    order=1,
    schema_version=1,
    data_schema=OrientationData,
    default_data=default_data,
    migrations={},
)
