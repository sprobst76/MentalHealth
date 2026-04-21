"""YSQ module — Young Schema Questionnaire (YSQ-S3) answers and draft state.

Reference pattern: values.py. Mirror the structure exactly.

Data model:
  - answers: committed result after "Abschließen" click (90 integers, null = skipped item);
             null when no questionnaire run has been completed yet
  - draft:   in-progress answers during an active questionnaire session;
             null when no session is active (cleared after commit)
  - notes:   free-text note per schema, keyed by schema index string "0"–"17"
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from .registry import ModuleSpec


class YsqData(BaseModel):
    # null = no committed result yet; populated on "Abschließen"
    answers: list[int | None] | None = None
    # null = no in-progress session; populated while questionnaire is open
    draft: list[int | None] | None = None
    # key = schema index string "0"–"17"; value = free-text note
    notes: dict[str, str] = Field(default_factory=dict)


def default_data() -> dict[str, Any]:
    return YsqData().model_dump(mode="json")


migrations: dict[int, Any] = {
    # 2: lambda d: {**d, "new_field": []},
}


SPEC = ModuleSpec(
    id="ysq",
    title="Schemafragebögen (YSQ)",
    phase_num="02",
    order=60,
    schema_version=1,
    data_schema=YsqData,
    default_data=default_data,
    migrations=migrations,
)
