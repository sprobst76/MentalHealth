"""Snapshot endpoints — create, list, and retrieve point-in-time module captures.

POST /api/snapshots  — capture current module state
GET  /api/snapshots  — list snapshot metadata (no data blob)
GET  /api/snapshots/{id} — full snapshot with forward-migrated module data

Design decisions (see threat model in 04-02-PLAN.md):
- user_id always from Depends(current_user_id), never from payload (T-4-03)
- GET /{id} filters by both snapshot id AND user_id — 404 if not found (T-4-04)
- MAX_SNAPSHOTS = 200 guard on POST to prevent unbounded writes (T-4-05)
- _migrate_snapshot_modules wraps spec.migrate() in try/except — returns original
  data on failure instead of raising 500 (T-4-07, QUAL-04 principle)
- Snapshots are IMMUTABLE — migrated data is never written back to snap.data
"""
from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session, func, select

from ..auth import current_user_id
from ..db import get_session
from ..models import ModuleRecord, Snapshot
from ..modules.registry import get_module
from ..schemas.api import SnapshotFullResponse

logger = logging.getLogger(__name__)

MAX_SNAPSHOTS = 200

router = APIRouter(prefix="/api/snapshots", tags=["snapshots"])


def _migrate_snapshot_modules(modules_blob: dict) -> dict:
    """Forward-migrate each module entry in a snapshot blob.

    Unknown module IDs are passed through unchanged (forward-compat).
    Migration exceptions are caught and logged — original data is returned
    rather than raising a 500 (QUAL-04).
    Snapshots are IMMUTABLE; this function never writes back to the database.
    """
    result: dict = {}
    for module_id, entry in modules_blob.items():
        spec = get_module(module_id)
        if spec is None:
            # Unknown module — pass through unchanged for forward-compatibility
            result[module_id] = entry
            continue

        stored_version = entry.get("schema_version", 1)
        data = entry.get("data", {})

        if stored_version < spec.schema_version:
            try:
                data = spec.migrate(data, stored_version)
                stored_version = spec.schema_version
            except Exception as exc:
                logger.error(
                    "Snapshot migration failed for %r (v%d → v%d): %s",
                    module_id,
                    stored_version,
                    spec.schema_version,
                    exc,
                    exc_info=True,
                )
                # Return original data — never raise 500 (QUAL-04)
                data = entry.get("data", {})
                stored_version = entry.get("schema_version", 1)

        result[module_id] = {"schema_version": stored_version, "data": data}

    return result


@router.post("", status_code=201)
def create_snapshot(
    payload: dict = Body(default_factory=dict),
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
    """Capture the current state of all module records as an immutable snapshot.

    Returns metadata only (id, label, created_at) — no modules blob in response.
    Raises HTTP 422 if the user already has MAX_SNAPSHOTS snapshots.
    """
    count = session.exec(
        select(func.count()).where(Snapshot.user_id == user_id)
    ).one()
    if count >= MAX_SNAPSHOTS:
        raise HTTPException(
            status_code=422,
            detail=f"Maximum number of snapshots ({MAX_SNAPSHOTS}) reached.",
        )

    records = session.exec(
        select(ModuleRecord).where(ModuleRecord.user_id == user_id)
    ).all()

    modules_blob = {
        r.module_id: {"schema_version": r.schema_version, "data": r.data}
        for r in records
    }

    label: str | None = payload.get("label") or None

    snap = Snapshot(
        user_id=user_id,
        label=label,
        data={"modules": modules_blob},
    )
    session.add(snap)
    session.commit()
    session.refresh(snap)

    return {
        "id": str(snap.id),
        "label": snap.label,
        "created_at": snap.created_at.isoformat(),
    }


@router.get("")
def list_snapshots(
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> list[dict]:
    """List snapshot metadata for the authenticated user, newest first.

    Returns id, label, created_at per entry — no data blob included.
    """
    snaps = session.exec(
        select(Snapshot)
        .where(Snapshot.user_id == user_id)
        .order_by(Snapshot.created_at.desc())  # type: ignore[arg-type]
    ).all()

    return [
        {
            "id": str(s.id),
            "label": s.label,
            "created_at": s.created_at.isoformat(),
        }
        for s in snaps
    ]


@router.get("/{snapshot_id}", response_model=SnapshotFullResponse)
def get_snapshot(
    snapshot_id: UUID,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> SnapshotFullResponse:
    """Retrieve a single snapshot with forward-migrated module data.

    Filters by both snapshot_id AND user_id (T-4-04) — returns 404 if the
    snapshot does not exist or belongs to a different user. Module data is
    forward-migrated on the fly; the snapshot itself is never mutated
    (immutability guarantee).
    """
    snap = session.exec(
        select(Snapshot).where(
            Snapshot.id == snapshot_id,
            Snapshot.user_id == user_id,  # enforces T-4-04
        )
    ).first()

    if snap is None:
        raise HTTPException(status_code=404, detail="Snapshot not found.")

    modules_blob: dict = snap.data.get("modules", {})
    migrated = _migrate_snapshot_modules(modules_blob)

    return SnapshotFullResponse(
        id=snap.id,
        label=snap.label,
        created_at=snap.created_at,
        modules=migrated,
    )
