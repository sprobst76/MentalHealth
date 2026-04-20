from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, UniqueConstraint
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Single-user for v1, but the user table is already here so the foreign key
# and multi-user path are in place when needed.
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = "owner"
    created_at: datetime = Field(default_factory=_utcnow)


class ModuleRecord(SQLModel, table=True):
    __tablename__ = "module_records"
    __table_args__ = (UniqueConstraint("user_id", "module_id", name="uq_user_module"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    module_id: str = Field(index=True, max_length=50)
    schema_version: int
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class Snapshot(SQLModel, table=True):
    __tablename__ = "snapshots"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    label: str | None = None
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=_utcnow)
