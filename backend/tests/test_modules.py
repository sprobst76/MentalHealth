from __future__ import annotations

from unittest.mock import patch

import pytest
from sqlmodel import Session, select

from app.models import ModuleRecord


@pytest.mark.asyncio
async def test_migration_error_returns_last_known_good(client, auth_headers, test_engine):
    """QUAL-04: if spec.migrate raises, GET returns original data not 500."""
    from app.modules.registry import get_module

    module_id = "values"
    spec = get_module(module_id)
    assert spec is not None

    # PUT some data at the current schema version so a record exists
    put_resp = await client.put(
        f"/api/modules/{module_id}",
        json={"items": []},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200

    # Directly lower the stored schema_version so the router thinks migration is needed
    stale_version = spec.schema_version - 1
    with Session(test_engine) as session:
        record = session.exec(
            select(ModuleRecord).where(ModuleRecord.module_id == module_id)
        ).first()
        assert record is not None, "Record should exist after PUT"
        record.schema_version = stale_version
        session.add(record)
        session.commit()

    # Now patch ModuleSpec.migrate at class level to raise — the frozen dataclass
    # cannot be patched on the instance, so we patch the class method instead.
    # The router should catch the exception and return last-known-good (HTTP 200).
    from app.modules.registry import ModuleSpec

    with patch.object(ModuleSpec, "migrate", side_effect=RuntimeError("test migration boom")):
        get_resp = await client.get(
            f"/api/modules/{module_id}",
            headers=auth_headers,
        )

    assert get_resp.status_code == 200, (
        f"Expected 200 after migration failure, got {get_resp.status_code}: {get_resp.text}"
    )
