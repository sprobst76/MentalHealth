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


@pytest.mark.asyncio
async def test_checkin_roundtrip(client, auth_headers):
    """CONT-01: checkin PUT/GET round-trip returns correct data shape."""
    put_resp = await client.put(
        "/api/modules/checkin",
        json={"entries": []},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200, f"PUT failed: {put_resp.text}"
    get_resp = await client.get("/api/modules/checkin", headers=auth_headers)
    assert get_resp.status_code == 200, f"GET failed: {get_resp.text}"
    payload = get_resp.json()
    assert "data" in payload
    assert "entries" in payload["data"]
    assert payload["data"]["entries"] == []


@pytest.mark.asyncio
async def test_ysq_roundtrip(client, auth_headers):
    """CONT-02: ysq PUT/GET round-trip preserves 90-element answers array."""
    answers = [1] * 90
    put_resp = await client.put(
        "/api/modules/ysq",
        json={"answers": answers, "draft": None, "notes": {}},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200, f"PUT failed: {put_resp.text}"
    get_resp = await client.get("/api/modules/ysq", headers=auth_headers)
    assert get_resp.status_code == 200, f"GET failed: {get_resp.text}"
    payload = get_resp.json()
    assert payload["data"]["answers"] == answers
    assert payload["data"]["draft"] is None


@pytest.mark.asyncio
async def test_ysq_null_slots_preserved(client, auth_headers):
    """CONT-02: null slots in ysq answers array survive round-trip (skipped items)."""
    # Mix of answered (1–4) and skipped (null) items across 90 slots
    answers = [1, 2, None, 4, 3] * 18  # 90 items, every 3rd item null
    put_resp = await client.put(
        "/api/modules/ysq",
        json={"answers": answers, "draft": None, "notes": {"0": "Testnotiz"}},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200, f"PUT failed: {put_resp.text}"
    get_resp = await client.get("/api/modules/ysq", headers=auth_headers)
    assert get_resp.status_code == 200, f"GET failed: {get_resp.text}"
    payload = get_resp.json()
    assert payload["data"]["answers"] == answers, "null slots must survive round-trip"
    assert payload["data"]["notes"] == {"0": "Testnotiz"}
