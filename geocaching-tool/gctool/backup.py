"""Backup von Lesezeichen-Listen und Pocket Queries."""
from __future__ import annotations

import datetime as _dt
import json
from pathlib import Path
from typing import Callable

from .client import GeocachingClient

LISTS_BACKUP_SCHEMA = "gctool/lists-backup"
LISTS_BACKUP_VERSION = 1
PQ_BACKUP_SCHEMA = "gctool/pq-backup"
PQ_BACKUP_VERSION = 1

Progress = Callable[[str], None]


def _now() -> str:
    return _dt.datetime.now(_dt.timezone.utc).isoformat()


def _noop(_: str) -> None:
    pass


def _normalize_list(raw: dict) -> dict:
    return {
        "referenceCode": raw.get("referenceCode") or raw.get("ReferenceCode"),
        "name": raw.get("name") or raw.get("Name"),
        "description": raw.get("description") or raw.get("Description") or "",
        "type": raw.get("type") or raw.get("Type"),
        "isPublic": bool(raw.get("isPublic", raw.get("IsPublic", False))),
        "isShared": bool(raw.get("isShared", raw.get("IsShared", False))),
        "count": raw.get("count", raw.get("Count")),
    }


def _gc_code(geocache: dict) -> str | None:
    return geocache.get("referenceCode") or geocache.get("code") or geocache.get("gcCode")


def backup_lists(
    client: GeocachingClient,
    list_type: str | None = None,
    with_geocaches: bool = True,
    progress: Progress = _noop,
) -> dict:
    """Liest alle (gefilterten) Listen samt enthaltenen Geocaches."""
    progress("Lade Listenuebersicht ...")
    raw_lists = client.get_lists(list_type=list_type)
    out_lists = []
    for raw in raw_lists:
        meta = _normalize_list(raw)
        ref = meta["referenceCode"]
        geocaches: list[dict] = []
        if with_geocaches and ref:
            progress(f"  Liste '{meta['name']}' ({ref}) - lade Geocaches ...")
            for gc in client.get_list_geocaches(ref):
                geocaches.append(
                    {"referenceCode": _gc_code(gc), "name": gc.get("name") or gc.get("Name")}
                )
        meta["geocaches"] = geocaches
        meta["geocacheCount"] = len(geocaches)
        out_lists.append(meta)

    return {
        "schema": LISTS_BACKUP_SCHEMA,
        "version": LISTS_BACKUP_VERSION,
        "exported_at": _now(),
        "source": client.base,
        "count": len(out_lists),
        "lists": out_lists,
    }


def write_lists_backup(data: dict, path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def load_lists_backup(path: str | Path) -> dict:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("schema") != LISTS_BACKUP_SCHEMA:
        raise ValueError(f"Unerwartetes Backup-Schema: {data.get('schema')!r}")
    return data


def backup_pocket_queries(
    client: GeocachingClient,
    dest_dir: str | Path,
    download_gpx: bool = True,
    save_settings: bool = True,
    progress: Progress = _noop,
) -> dict:
    """Speichert PQ-Metadaten, optional die GPX-Ergebnisse und die Einstellungs-HTML."""
    dest = Path(dest_dir)
    dest.mkdir(parents=True, exist_ok=True)
    progress("Lade Pocket-Query-Uebersicht ...")
    pqs = client.get_pocket_queries()

    entries = []
    for pq in pqs:
        guid = pq["guid"]
        entry = dict(pq)
        if download_gpx:
            gpx_path = dest / f"{_safe(pq['name'])}_{guid}.zip"
            try:
                progress(f"  PQ '{pq['name']}' - lade GPX ...")
                client.download_pocket_query(guid, str(gpx_path))
                entry["gpx_file"] = gpx_path.name
            except Exception as exc:  # noqa: BLE001 - best effort, Fehler protokollieren
                entry["gpx_error"] = str(exc)
        if save_settings:
            try:
                html = client.get_pq_settings_html(guid)
                settings_path = dest / f"{_safe(pq['name'])}_{guid}.settings.html"
                settings_path.write_text(html, encoding="utf-8")
                entry["settings_file"] = settings_path.name
            except Exception as exc:  # noqa: BLE001
                entry["settings_error"] = str(exc)
        entries.append(entry)

    index = {
        "schema": PQ_BACKUP_SCHEMA,
        "version": PQ_BACKUP_VERSION,
        "exported_at": _now(),
        "source": client.base,
        "count": len(entries),
        "pocket_queries": entries,
    }
    (dest / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return index


def load_pq_backup(dest_dir: str | Path) -> dict:
    index_path = Path(dest_dir) / "index.json"
    data = json.loads(index_path.read_text(encoding="utf-8"))
    if data.get("schema") != PQ_BACKUP_SCHEMA:
        raise ValueError(f"Unerwartetes Backup-Schema: {data.get('schema')!r}")
    return data


def _safe(name: str | None) -> str:
    """Macht einen Namen dateisystem-tauglich."""
    if not name:
        return "pq"
    keep = "".join(c if c.isalnum() or c in " -_." else "_" for c in name).strip()
    return (keep or "pq")[:80]
