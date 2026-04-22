"""Export and import of all module data.

GET  /api/export  — returns all module records in HTML-v1 flat format
POST /api/import  — writes raw blobs without Pydantic validation; lazy migration on next GET

Design decisions (see threat model in 03-01-PLAN.md):
- user_id always from Depends(current_user_id), never from payload (T-03-01)
- SELECT filters on user_id to prevent information disclosure (T-03-02)
- No Pydantic validation on import — raw blob in, lazy migration on next GET (PORT-02)
- No get_module() call — unknown module IDs are accepted for HTML-v1 compat (PORT-02)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session, select

from ..auth import current_user_id
from ..db import get_session
from ..models import ModuleRecord

logger = logging.getLogger(__name__)

MAX_IMPORT_ENTRIES = 100
MODULE_ID_MAX_LEN = 50

router = APIRouter(prefix="/api", tags=["portability"])


@router.get("/export")
def export_all(
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
    """Export all module records for the authenticated user in HTML-v1 flat format."""
    records = session.exec(
        select(ModuleRecord).where(ModuleRecord.user_id == user_id)
    ).all()
    out: dict = {
        "_version": 1,
        "_exported": datetime.now(timezone.utc).isoformat(),
    }
    for r in records:
        out[r.module_id] = {
            "schema_version": r.schema_version,
            "data": r.data,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
    return out


@router.post("/import", status_code=200)
def import_all(
    payload: dict = Body(...),
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
    """Import module data from an HTML-v1 compatible JSON payload.

    Accepts unknown module IDs (e.g. 'orientation' from HTML-v1 exports).
    Skips metadata keys starting with '_' and malformed entries.
    Does not validate against module schemas — lazy migration on next GET.
    """
    if len(payload) > MAX_IMPORT_ENTRIES:
        raise HTTPException(status_code=422, detail="Too many entries in import payload.")

    imported: list[str] = []
    skipped: list[str] = []
    now = datetime.now(timezone.utc)

    for key, entry in payload.items():
        # Skip metadata keys (_version, _exported, etc.)
        if key.startswith("_") or not isinstance(entry, dict):
            continue
        if len(key) > MODULE_ID_MAX_LEN:
            skipped.append(key[:MODULE_ID_MAX_LEN] + "…")
            continue
        if "data" not in entry or "schema_version" not in entry:
            skipped.append(key)
            continue

        module_id = key
        try:
            schema_version = int(entry["schema_version"])
        except (TypeError, ValueError):
            skipped.append(key)
            continue
        data = entry["data"]

        record = session.exec(
            select(ModuleRecord).where(
                ModuleRecord.user_id == user_id,
                ModuleRecord.module_id == module_id,
            )
        ).first()

        if record is None:
            record = ModuleRecord(
                user_id=user_id,
                module_id=module_id,
                schema_version=schema_version,
                data=data,
                created_at=now,
                updated_at=now,
            )
        else:
            record.schema_version = schema_version
            record.data = data
            record.updated_at = now

        session.add(record)
        imported.append(module_id)

    session.commit()
    return {"imported": imported, "skipped": skipped}
