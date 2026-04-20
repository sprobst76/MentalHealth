from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlmodel import Session, select

from .config import settings
from .db import get_session
from .models import User

SINGLE_USER_NAME = "owner"


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    """Single-user auth: one shared bearer token from env.

    The CLAUDE.md notes that auth enforcement can be toggled during setup.
    Set KOMPASS_TOKEN to an empty string to disable the check for local dev.
    """
    expected = settings.kompass_token
    if expected:
        token = _extract_token(authorization)
        if token != expected:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing bearer token.",
            )

    user = session.exec(select(User).where(User.name == SINGLE_USER_NAME)).first()
    if user is None:
        user = User(name=SINGLE_USER_NAME)
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


def current_user_id(user: User = Depends(get_current_user)) -> UUID:
    return user.id
