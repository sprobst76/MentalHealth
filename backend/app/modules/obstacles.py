"""Obstacles module — barriers between current state and goals, with cross-refs."""
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field
from .registry import ModuleSpec


class Ref(BaseModel):
    moduleId: str
    id: str


class Obstacle(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    goal_refs: list[Ref] = Field(default_factory=list)
    belief_refs: list[Ref] = Field(default_factory=list)
    strategy: str = ""


class ObstaclesData(BaseModel):
    obstacles: list[Obstacle] = Field(default_factory=list)
    reflection: str = ""


def default_data() -> dict[str, Any]:
    return ObstaclesData().model_dump(mode="json")


SPEC = ModuleSpec(
    id="obstacles",
    title="Hindernisse",
    phase_num="05",
    order=50,
    schema_version=1,
    data_schema=ObstaclesData,
    default_data=default_data,
    migrations={},
)
