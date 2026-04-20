"""Beliefs-Schema module — limiting beliefs derived from Early Maladaptive Schemas.

For each active schema the user identifies the core belief, rates its intensity,
and begins building counter-evidence and an alternative belief.
"""
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field
from .registry import ModuleSpec


class BeliefEntry(BaseModel):
    schema_id: str
    active: bool = True
    intensity: int = Field(default=3, ge=1, le=5)
    personal_text: str = ""
    counter_evidence: str = ""
    alternative: str = ""


class BeliefsSchemaData(BaseModel):
    entries: list[BeliefEntry] = Field(default_factory=list)
    reflection: str = ""


def default_data() -> dict[str, Any]:
    return BeliefsSchemaData().model_dump(mode="json")


SPEC = ModuleSpec(
    id="beliefs_schema",
    title="Glaubenssätze",
    phase_num="02",
    order=20,
    schema_version=1,
    data_schema=BeliefsSchemaData,
    default_data=default_data,
    migrations={},
    school="Schema",
)
