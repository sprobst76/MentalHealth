"""Wiederherstellen von Lesezeichen-Listen aus einem Backup.

Wiederhergestellte Listen bekommen neue Referenzcodes (die alten BM-Codes lassen
sich nicht erzwingen), Name, Beschreibung und enthaltene Geocaches bleiben aber
erhalten - die Liste ist also wieder nutzbar.
"""
from __future__ import annotations

from typing import Callable

from .client import GeocachingClient

Progress = Callable[[str], None]
_BULK_CHUNK = 500  # Geocaches pro Bulk-Aufruf


def _noop(_: str) -> None:
    pass


def _chunks(seq: list, size: int):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def restore_lists(
    client: GeocachingClient,
    backup: dict,
    allow_duplicates: bool = False,
    dry_run: bool = True,
    progress: Progress = _noop,
) -> list[dict]:
    """Legt die Listen aus dem Backup neu an und fuegt die Geocaches wieder hinzu."""
    existing_names: set[str] = set()
    if not allow_duplicates:
        existing_names = {
            (lst.get("name") or "").strip().lower() for lst in client.get_lists()
        }

    results: list[dict] = []
    for lst in backup.get("lists", []):
        name = (lst.get("name") or "").strip()
        gc_codes = [
            g["referenceCode"]
            for g in lst.get("geocaches", [])
            if g.get("referenceCode")
        ]
        result: dict = {"name": name, "geocaches": len(gc_codes)}

        if not name:
            result["status"] = "skipped_no_name"
            results.append(result)
            continue

        if not allow_duplicates and name.lower() in existing_names:
            result["status"] = "skipped_exists"
            results.append(result)
            continue

        if dry_run:
            result["status"] = "would_create"
            results.append(result)
            continue

        list_type = lst.get("type") if isinstance(lst.get("type"), str) and lst.get("type") else "bm"
        progress(f"Erstelle Liste '{name}' ...")
        created = client.create_list(
            name=name,
            description=lst.get("description", ""),
            list_type=list_type,
            is_public=bool(lst.get("isPublic", False)),
            is_shared=bool(lst.get("isShared", False)),
        )
        new_ref = (created or {}).get("referenceCode")
        added = 0
        if gc_codes and new_ref:
            for chunk in _chunks(gc_codes, _BULK_CHUNK):
                progress(f"  fuege {len(chunk)} Geocaches hinzu ...")
                client.add_geocaches(new_ref, chunk)
                added += len(chunk)

        result["status"] = "created"
        result["referenceCode"] = new_ref
        result["geocaches"] = added
        existing_names.add(name.lower())
        results.append(result)

    return results
