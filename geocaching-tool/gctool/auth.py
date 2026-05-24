"""Aufbau einer authentifizierten requests.Session aus dem Browser-Cookie.

Der Nutzer kopiert aus dem eingeloggten Browser entweder
  * nur den Wert des `gspkauth`-Cookies, oder
  * den kompletten Cookie-Header (z. B. "gspkauth=...; foo=bar; ...").
Beides wird hier erkannt.
"""
from __future__ import annotations

import requests

from .config import USER_AGENT

GSPKAUTH = "gspkauth"
COOKIE_DOMAIN = ".geocaching.com"


def parse_cookie_input(raw: str) -> dict[str, str]:
    """Zerlegt die Cookie-Eingabe in einzelne Cookies.

    Enthaelt die Eingabe ein '=', wird sie als Cookie-Header interpretiert
    (k=v; k2=v2). Andernfalls gilt der ganze String als gspkauth-Token.
    """
    raw = raw.strip()
    if not raw:
        return {}
    if "=" not in raw:
        return {GSPKAUTH: raw}

    cookies: dict[str, str] = {}
    for part in raw.split(";"):
        part = part.strip()
        if not part or "=" not in part:
            continue
        name, value = part.split("=", 1)
        cookies[name.strip()] = value.strip()
    return cookies


def build_session(cookie: str, user_agent: str = USER_AGENT) -> requests.Session:
    """Erzeugt eine Session mit gesetzten Cookies und passenden Headern."""
    session = requests.Session()
    for name, value in parse_cookie_input(cookie).items():
        session.cookies.set(name, value, domain=COOKIE_DOMAIN)

    session.headers.update(
        {
            "User-Agent": user_agent,
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.geocaching.com/account/lists",
            "X-Requested-With": "XMLHttpRequest",
        }
    )
    return session


def has_auth_cookie(session: requests.Session) -> bool:
    """True, wenn das gspkauth-Cookie gesetzt ist."""
    return any(c.name == GSPKAUTH for c in session.cookies)
