from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel


@dataclass(frozen=True)
class ModuleSpec:
    """Describes one reflection module.

    Each module owns its own schema, default, and data-migration chain.
    Modules are registered in MODULES below and surfaced through the
    generic /api/modules router.
    """

    id: str
    title: str
    phase_num: str
    order: int
    schema_version: int
    data_schema: type[BaseModel]
    default_data: Callable[[], dict[str, Any]]
    migrations: dict[int, Callable[[dict[str, Any]], dict[str, Any]]]
    school: str | None = None

    def migrate(self, data: dict[str, Any], from_version: int) -> dict[str, Any]:
        """Run any registered migrations from from_version up to schema_version."""
        current = data
        for v in range(from_version + 1, self.schema_version + 1):
            migration = self.migrations.get(v)
            if migration is not None:
                current = migration(current)
        return current

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        """Validate with Pydantic, returning the normalized dict."""
        return self.data_schema.model_validate(data).model_dump(mode="json")


def _build_modules() -> list[ModuleSpec]:
    from . import orientation, values  # late import — each module file defines one SPEC

    specs = [orientation.SPEC, values.SPEC]
    specs.sort(key=lambda s: s.order)
    return specs


MODULES: list[ModuleSpec] = _build_modules()
_BY_ID: dict[str, ModuleSpec] = {m.id: m for m in MODULES}


def get_module(module_id: str) -> ModuleSpec | None:
    return _BY_ID.get(module_id)


def module_ids() -> list[str]:
    return [m.id for m in MODULES]
