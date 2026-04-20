"""Generic CRUD for module records.

One endpoint family drives every reflection module. The registry supplies
validation, defaults, and data migrations; the database only stores a blob.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlmodel import Session, select

from ..auth import current_user_id
from ..db import get_session
from ..models import ModuleRecord
from ..modules import MODULES, get_module
from ..schemas import ModuleDataResponse, ModuleSpecResponse

router = APIRouter(prefix="/api/modules", tags=["modules"])


@router.get("", response_model=list[ModuleSpecResponse])
def list_modules() -> list[ModuleSpecResponse]:
    return [
        ModuleSpecResponse(
            id=m.id,
            title=m.title,
            phase_num=m.phase_num,
            order=m.order,
            schema_version=m.schema_version,
            school=m.school,
        )
        for m in MODULES
    ]


def _load_or_default(
    session: Session, user_id: UUID, module_id: str
) -> ModuleDataResponse:
    spec = get_module(module_id)
    if spec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown module '{module_id}'.")

    record = session.exec(
        select(ModuleRecord).where(
            ModuleRecord.user_id == user_id, ModuleRecord.module_id == module_id
        )
    ).first()

    if record is None:
        return ModuleDataResponse(
            module_id=module_id,
            schema_version=spec.schema_version,
            data=spec.default_data(),
        )

    data = record.data
    if record.schema_version < spec.schema_version:
        data = spec.migrate(data, record.schema_version)
        record.schema_version = spec.schema_version
        record.data = data
        record.updated_at = datetime.now(timezone.utc)
        session.add(record)
        session.commit()
        session.refresh(record)

    return ModuleDataResponse(
        module_id=module_id,
        schema_version=record.schema_version,
        data=record.data,
        updated_at=record.updated_at,
    )


@router.get("/{module_id}", response_model=ModuleDataResponse)
def get_module_data(
    module_id: str,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> ModuleDataResponse:
    return _load_or_default(session, user_id, module_id)


@router.put("/{module_id}", response_model=ModuleDataResponse)
def put_module_data(
    module_id: str,
    payload: dict = Body(...),
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> ModuleDataResponse:
    spec = get_module(module_id)
    if spec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown module '{module_id}'.")

    try:
        normalized = spec.validate(payload)
    except Exception as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc

    record = session.exec(
        select(ModuleRecord).where(
            ModuleRecord.user_id == user_id, ModuleRecord.module_id == module_id
        )
    ).first()

    now = datetime.now(timezone.utc)
    if record is None:
        record = ModuleRecord(
            user_id=user_id,
            module_id=module_id,
            schema_version=spec.schema_version,
            data=normalized,
            created_at=now,
            updated_at=now,
        )
    else:
        record.schema_version = spec.schema_version
        record.data = normalized
        record.updated_at = now

    session.add(record)
    session.commit()
    session.refresh(record)

    return ModuleDataResponse(
        module_id=module_id,
        schema_version=record.schema_version,
        data=record.data,
        updated_at=record.updated_at,
    )
