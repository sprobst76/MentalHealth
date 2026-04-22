from __future__ import annotations

import pytest
from sqlmodel import Session, select

from app.models import ModuleRecord


@pytest.mark.asyncio
async def test_export_format(client, auth_headers):
    """PORT-01: GET /api/export liefert _version und _exported im Response."""
    resp = await client.get("/api/export", headers=auth_headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    body = resp.json()
    assert "_version" in body, "Response muss '_version' enthalten"
    assert body["_version"] == 1, f"_version muss 1 sein, ist {body['_version']}"
    assert "_exported" in body, "Response muss '_exported' (ISO-Timestamp) enthalten"
    assert isinstance(body["_exported"], str), "_exported muss ein String sein"


@pytest.mark.asyncio
async def test_export_all_modules(client, auth_headers):
    """PORT-01: Export enthält gespeicherte Module mit schema_version und data."""
    # Daten für values-Modul speichern
    put_resp = await client.put(
        "/api/modules/values",
        json={"selected": [], "intentions": [], "reflection": ""},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200, f"PUT failed: {put_resp.text}"

    # Export abrufen
    resp = await client.get("/api/export", headers=auth_headers)
    assert resp.status_code == 200, f"GET /api/export failed: {resp.text}"
    body = resp.json()
    assert "values" in body, "Export muss 'values' enthalten nach PUT"
    assert "schema_version" in body["values"], "values-Eintrag muss 'schema_version' enthalten"
    assert "data" in body["values"], "values-Eintrag muss 'data' enthalten"


@pytest.mark.asyncio
async def test_import_stores_blob(client, auth_headers, test_engine):
    """PORT-01: POST /api/import schreibt Blob in DB und gibt imported-Liste zurück."""
    payload = {
        "values": {
            "schema_version": 1,
            "data": {"selected": [], "intentions": [], "reflection": ""},
        }
    }
    resp = await client.post("/api/import", json=payload, headers=auth_headers)
    assert resp.status_code == 200, f"POST /api/import failed: {resp.text}"
    body = resp.json()
    assert "imported" in body, "Response muss 'imported' enthalten"
    assert "skipped" in body, "Response muss 'skipped' enthalten"
    assert "values" in body["imported"], f"'values' muss in imported sein: {body}"
    assert body["skipped"] == [], f"skipped muss leer sein: {body['skipped']}"

    # Direkter DB-Check: ModuleRecord muss angelegt sein
    with Session(test_engine) as session:
        record = session.exec(
            select(ModuleRecord).where(ModuleRecord.module_id == "values")
        ).first()
        assert record is not None, "ModuleRecord für 'values' muss in DB existieren"
        assert record.module_id == "values"


@pytest.mark.asyncio
async def test_import_html_v1_compat(client, auth_headers, test_engine):
    """PORT-02: Import akzeptiert HTML-v1-Format inkl. unbekannter Modul-IDs."""
    payload = {
        "_version": 1,
        "_exported": "2026-04-20T16:34:01.372Z",
        "orientation": {
            "schema_version": 1,
            "data": {"responses": []},
            "updated_at": "2026-04-20T16:29:28.165Z",
        },
        "values": {
            "schema_version": 1,
            "data": {"selected": [], "intentions": [], "reflection": ""},
            "updated_at": "2026-04-20T19:43:25.869Z",
        },
    }
    resp = await client.post("/api/import", json=payload, headers=auth_headers)
    assert resp.status_code == 200, f"POST /api/import failed: {resp.text}"
    body = resp.json()
    assert set(body["imported"]) == {"orientation", "values"}, (
        f"Beide Module müssen importiert sein: {body['imported']}"
    )
    assert body["skipped"] == [], f"skipped muss leer sein: {body['skipped']}"

    # Direkter DB-Check: 'orientation' landet trotz fehlendem Registry-Eintrag in der DB
    with Session(test_engine) as session:
        record = session.exec(
            select(ModuleRecord).where(ModuleRecord.module_id == "orientation")
        ).first()
        assert record is not None, "'orientation' muss trotz fehlendem Registry-Eintrag in DB sein"


@pytest.mark.asyncio
async def test_import_roundtrip(client, auth_headers):
    """PORT-01+02: Nach POST /api/import sind Daten über GET /api/modules/{id} abrufbar."""
    payload = {
        "values": {
            "schema_version": 1,
            "data": {"selected": [], "intentions": [], "reflection": ""},
        }
    }
    import_resp = await client.post("/api/import", json=payload, headers=auth_headers)
    assert import_resp.status_code == 200, f"Import failed: {import_resp.text}"

    get_resp = await client.get("/api/modules/values", headers=auth_headers)
    assert get_resp.status_code == 200, f"GET after import failed: {get_resp.text}"
    body = get_resp.json()
    assert "data" in body, "Response muss 'data' enthalten"
    assert body["data"]["selected"] == [], (
        f"selected muss [] sein nach Import: {body['data']}"
    )
