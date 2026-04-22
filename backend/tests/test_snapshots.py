from __future__ import annotations

import pytest
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlmodel import Session, select

from app.models import Snapshot


@pytest.mark.asyncio
async def test_create_snapshot(client, auth_headers, test_engine):
    """SNAP-01: POST /api/snapshots liefert 201 mit Metadaten-Keys und kein modules-Key."""
    resp = await client.post("/api/snapshots", json={}, headers=auth_headers)
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    body = resp.json()
    assert "id" in body, "Response muss 'id' enthalten"
    assert "label" in body, "Response muss 'label' enthalten"
    assert "created_at" in body, "Response muss 'created_at' enthalten"
    assert "modules" not in body, "Response darf kein 'modules'-Key enthalten (metadata only)"

    # DB-Check: Snapshot-Row muss existieren und modules-Key im data-Blob haben
    snap_id = UUID(body["id"])
    with Session(test_engine) as session:
        snap = session.exec(select(Snapshot).where(Snapshot.id == snap_id)).first()
        assert snap is not None, "Snapshot muss in der DB existieren"
        assert "modules" in snap.data, "snap.data muss 'modules'-Key enthalten"


@pytest.mark.asyncio
async def test_create_snapshot_label(client, auth_headers, test_engine):
    """SNAP-01: POST /api/snapshots mit label speichert den Label-Wert korrekt."""
    # Mit Label
    resp_with = await client.post(
        "/api/snapshots", json={"label": "Woche 1"}, headers=auth_headers
    )
    assert resp_with.status_code == 201, f"Expected 201, got {resp_with.status_code}: {resp_with.text}"
    body_with = resp_with.json()
    assert body_with["label"] == "Woche 1", f"label muss 'Woche 1' sein, ist {body_with['label']!r}"

    # Ohne Label
    resp_without = await client.post("/api/snapshots", json={}, headers=auth_headers)
    assert resp_without.status_code == 201, (
        f"Expected 201, got {resp_without.status_code}: {resp_without.text}"
    )
    body_without = resp_without.json()
    assert body_without["label"] is None, (
        f"label muss None sein bei leerem Body, ist {body_without['label']!r}"
    )


@pytest.mark.asyncio
async def test_list_snapshots(client, auth_headers, test_engine):
    """SNAP-02: GET /api/snapshots liefert Liste mit Metadaten-Only-Eintraegen."""
    # Zwei Snapshots anlegen
    resp1 = await client.post("/api/snapshots", json={"label": "Snap A"}, headers=auth_headers)
    assert resp1.status_code == 201, f"Erster POST fehlgeschlagen: {resp1.text}"
    resp2 = await client.post("/api/snapshots", json={"label": "Snap B"}, headers=auth_headers)
    assert resp2.status_code == 201, f"Zweiter POST fehlgeschlagen: {resp2.text}"

    # Liste abrufen
    resp = await client.get("/api/snapshots", headers=auth_headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    body = resp.json()
    assert isinstance(body, list), f"Response muss eine Liste sein, ist {type(body)}"
    assert len(body) >= 2, f"Liste muss mindestens 2 Eintraege haben, hat {len(body)}"

    # Jeder Eintrag muss Metadaten-Keys haben und kein 'modules'-Key
    for item in body:
        assert "id" in item, f"Eintrag muss 'id' enthalten: {item}"
        assert "label" in item, f"Eintrag muss 'label' enthalten: {item}"
        assert "created_at" in item, f"Eintrag muss 'created_at' enthalten: {item}"
        assert "modules" not in item, f"Eintrag darf kein 'modules'-Key enthalten: {item}"


@pytest.mark.asyncio
async def test_get_snapshot_migrated(client, auth_headers, test_engine):
    """SNAP-03: GET /api/snapshots/{id} liefert vollstaendigen Snapshot mit modules-Dict."""
    # Modul-Daten sichern, damit module_records einen Eintrag hat
    put_resp = await client.put(
        "/api/modules/values",
        json={"selected": [], "intentions": [], "reflection": ""},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200, f"PUT values fehlgeschlagen: {put_resp.text}"

    # Snapshot erstellen (erfasst aktuellen Stand der module_records)
    snap_resp = await client.post("/api/snapshots", json={}, headers=auth_headers)
    assert snap_resp.status_code == 201, f"POST /api/snapshots fehlgeschlagen: {snap_resp.text}"
    snap_id = snap_resp.json()["id"]

    # Einzelnen Snapshot abrufen
    get_resp = await client.get(f"/api/snapshots/{snap_id}", headers=auth_headers)
    assert get_resp.status_code == 200, f"Expected 200, got {get_resp.status_code}: {get_resp.text}"
    body = get_resp.json()

    assert "id" in body, "Response muss 'id' enthalten"
    assert "label" in body, "Response muss 'label' enthalten"
    assert "created_at" in body, "Response muss 'created_at' enthalten"
    assert "modules" in body, "Response muss 'modules'-Key enthalten (vollstaendiger Snapshot)"
    assert isinstance(body["modules"], dict), f"'modules' muss ein Dict sein: {type(body['modules'])}"

    # values-Eintrag muss schema_version und data haben
    assert "values" in body["modules"], (
        f"'modules' muss 'values' enthalten: {list(body['modules'].keys())}"
    )
    values_entry = body["modules"]["values"]
    assert "schema_version" in values_entry, (
        f"values-Eintrag muss 'schema_version' enthalten: {values_entry}"
    )
    assert "data" in values_entry, f"values-Eintrag muss 'data' enthalten: {values_entry}"


@pytest.mark.asyncio
async def test_get_snapshot_migration_error(client, auth_headers, test_engine):
    """SNAP-03 / QUAL-04: GET eines Snapshots mit unbekanntem Modul schlaegt nicht fehl (Fallback)."""
    # Snapshot mit unbekanntem Modul direkt in DB einfuegen.
    # Den echten user_id des authentifizierten Nutzers ermitteln: ein
    # authentifizierter API-Call legt den "owner"-User an (lazy creation),
    # danach koennen wir ihn per DB-Query lesen.
    from app.models import User as AppUser
    from sqlmodel import select as sa_select

    # Einen auth. Call machen, damit "owner"-User in der Test-DB existiert.
    # /api/modules/values verwendet current_user_id → legt "owner"-User lazy an.
    await client.get("/api/modules/values", headers=auth_headers)

    with Session(test_engine) as session:
        owner = session.exec(
            sa_select(AppUser).where(AppUser.name == "owner")
        ).first()
        assert owner is not None, "owner-User muss nach auth. API-Call existieren"
        real_user_id = owner.id

    fake_snap_id = uuid4()  # ID vorab speichern — kein Zugriff auf expiriertes Objekt nach commit

    fake_snapshot = Snapshot(
        id=fake_snap_id,
        user_id=real_user_id,  # muss mit dem auth. user_id uebereinstimmen (T-4-04)
        label="Fehler-Test",
        data={
            "modules": {
                "fake_module_v99": {
                    "schema_version": 99,
                    "data": {"broken": True},
                }
            }
        },
        created_at=datetime.now(timezone.utc),
    )
    with Session(test_engine) as session:
        session.add(fake_snapshot)
        session.commit()

    # GET darf nicht mit 500 antworten — Fallback erwartet
    resp = await client.get(f"/api/snapshots/{fake_snap_id}", headers=auth_headers)
    assert resp.status_code == 200, f"Expected 200 (Fallback), got {resp.status_code}: {resp.text}"
    body = resp.json()
    assert "modules" in body, "Response muss 'modules' enthalten"

    # Original-Eintrag muss unveraendert vorhanden sein (kein Migration-Crash)
    assert "fake_module_v99" in body["modules"], (
        f"Original-Eintrag muss erhalten bleiben: {list(body['modules'].keys())}"
    )
    original = body["modules"]["fake_module_v99"]
    assert original["schema_version"] == 99, (
        f"schema_version muss 99 sein: {original['schema_version']}"
    )
