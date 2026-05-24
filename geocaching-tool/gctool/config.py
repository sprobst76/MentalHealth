"""Konfiguration: Pfade, User-Agent und das Aufloesen des Auth-Cookies."""
from __future__ import annotations

import os
from pathlib import Path

# Heimatverzeichnis fuer Cookie und Standard-Backups. Ueberschreibbar via GCTOOL_HOME.
HOME_DIR = Path(os.environ.get("GCTOOL_HOME", str(Path.home() / ".gctool")))
DEFAULT_BACKUP_DIR = HOME_DIR / "backups"
COOKIE_FILE = HOME_DIR / "cookie.txt"

# Realistischer User-Agent. geocaching.com blockt leere/auffaellige UAs.
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 gctool/1.0"
)

BASE_URL = "https://www.geocaching.com"


def resolve_cookie(cli_value: str | None = None, cookie_file: str | None = None) -> str | None:
    """Findet das Auth-Cookie in dieser Reihenfolge:

    1. Direkt uebergebener Wert (--cookie)
    2. Datei (--cookie-file)
    3. Umgebungsvariable GC_COOKIE
    4. Standard-Cookie-Datei (~/.gctool/cookie.txt)
    """
    if cli_value:
        return cli_value.strip()
    if cookie_file:
        p = Path(cookie_file).expanduser()
        if p.exists():
            return p.read_text(encoding="utf-8").strip()
        return None
    env = os.environ.get("GC_COOKIE")
    if env:
        return env.strip()
    if COOKIE_FILE.exists():
        return COOKIE_FILE.read_text(encoding="utf-8").strip()
    return None
