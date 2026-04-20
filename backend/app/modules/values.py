"""Values module — personal values, their weighting, and stated intentions.

Reference pattern for all other modules. When porting a new module, mirror the
structure:
  - a Pydantic model for item shape
  - a Pydantic model for module data
  - default_data() producing a fresh empty state
  - migrations dict keyed by target schema_version
  - a single SPEC exported at the bottom
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from .registry import ModuleSpec


class ValueItem(BaseModel):
    id: str
    label: str
    # 0 = not important, 5 = core. Matches RatingDots in the HTML reference.
    weight: int = Field(default=0, ge=0, le=5)
    note: str = ""


class Intention(BaseModel):
    id: str
    value_id: str
    text: str


class ValuesData(BaseModel):
    selected: list[ValueItem] = Field(default_factory=list)
    intentions: list[Intention] = Field(default_factory=list)
    reflection: str = ""


def default_data() -> dict[str, Any]:
    return ValuesData().model_dump(mode="json")


migrations: dict[int, Any] = {
    # Example for future use:
    # 2: lambda d: {**d, "new_field": []},
}


SPEC = ModuleSpec(
    id="values",
    title="Werte",
    phase_num="01",
    order=10,
    schema_version=1,
    data_schema=ValuesData,
    default_data=default_data,
    migrations=migrations,
)
