"""Beliefs-ACT module — value-based commitments, ACT-style defusion."""
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field
from .registry import ModuleSpec


class ActCommitment(BaseModel):
    id: str
    value_id: str = ""
    commitment: str = ""
    defusion: str = ""
    first_action: str = ""
    resonance: int = Field(default=3, ge=1, le=5)


class BeliefsActData(BaseModel):
    commitments: list[ActCommitment] = Field(default_factory=list)
    reflection: str = ""


def default_data() -> dict[str, Any]:
    return BeliefsActData().model_dump(mode="json")


SPEC = ModuleSpec(
    id="beliefs_act",
    title="Stärkende Glaubenssätze",
    phase_num="03",
    order=30,
    schema_version=1,
    data_schema=BeliefsActData,
    default_data=default_data,
    migrations={},
    school="ACT",
)
