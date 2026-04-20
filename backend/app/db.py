from collections.abc import Iterator

from sqlmodel import Session, create_engine

from .config import settings

_connect_args: dict = {}
if settings.database_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False

engine = create_engine(settings.database_url, echo=False, connect_args=_connect_args)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
