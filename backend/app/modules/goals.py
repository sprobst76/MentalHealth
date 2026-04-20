"""Goals module — concrete goals linked to values."""
from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field
from .registry import ModuleSpec


class ValueRef(BaseModel):
    moduleId: str = "values"
    id: str


class Goal(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    value_refs: list[ValueRef] = Field(default_factory=list)
    horizon: Literal["30days", "quarter", "year", "longer"] = "quarter"
    first_step: str = ""
    status: Literal["active", "achieved", "paused"] = "active"


class GoalsData(BaseModel):
    goals: list[Goal] = Field(default_factory=list)
    reflection: str = ""


def default_data() -> dict[str, Any]:
    return GoalsData().model_dump(mode="json")


SPEC = ModuleSpec(
    id="goals",
    title="Ziele",
    phase_num="04",
    order=40,
    schema_version=1,
    data_schema=GoalsData,
    default_data=default_data,
    migrations={},
)
