"""Sicheres Loeschen - immer gegen ein Backup abgesichert.

Grundregel: Es wird ausschliesslich geloescht, was im uebergebenen Backup
enthalten ist. Was nicht im Backup steht, wird nie angefasst. Zusaetzlich wird
die Geocache-Anzahl zwischen Server und Backup verglichen; bei Abweichung wird
die Liste vom Loeschen ausgenommen (Backup koennte unvollstaendig sein), ausser
man erzwingt es ausdruecklich.
"""
from __future__ import annotations

from typing import Callable

from .client import GeocachingClient

Progress = Callable[[str], None]


def _noop(_: str) -> None:
    pass


def _norm(value) -> str:
    return (value or "").strip().lower()


def plan_list_deletion(
    client: GeocachingClient,
    backup: dict,
    only_names: list[str] | None = None,
    only_refs: list[str] | None = None,
    ignore_count_mismatch: bool = False,
) -> dict:
    """Erstellt einen Loeschplan, ohne etwas zu veraendern."""
    backup_by_ref = {
        lst["referenceCode"]: lst
        for lst in backup.get("lists", [])
        if lst.get("referenceCode")
    }
    name_filter = {_norm(n) for n in only_names} if only_names else None
    ref_filter = set(only_refs) if only_refs else None

    to_delete: list[dict] = []
    not_in_backup: list[dict] = []
    count_mismatch: list[dict] = []

    for live in client.get_lists():
        ref = live.get("referenceCode")
        name = live.get("name")
        entry = {"referenceCode": ref, "name": name, "liveCount": live.get("count")}

        if ref_filter is not None and ref not in ref_filter:
            continue
        if name_filter is not None and _norm(name) not in name_filter:
            continue

        backup_entry = backup_by_ref.get(ref)
        if backup_entry is None:
            not_in_backup.append(entry)
            continue

        backup_count = backup_entry.get("geocacheCount")
        entry["backupCount"] = backup_count
        live_count = live.get("count")
        if (
            not ignore_count_mismatch
            and live_count is not None
            and backup_count is not None
            and int(live_count) != int(backup_count)
        ):
            count_mismatch.append(entry)
            continue

        to_delete.append(entry)

    return {
        "to_delete": to_delete,
        "not_in_backup": not_in_backup,
        "count_mismatch": count_mismatch,
    }


def execute_list_deletion(
    client: GeocachingClient, plan: dict, progress: Progress = _noop
) -> list[dict]:
    results: list[dict] = []
    for entry in plan["to_delete"]:
        ref = entry["referenceCode"]
        try:
            progress(f"Loesche Liste '{entry['name']}' ({ref}) ...")
            client.delete_list(ref)
            results.append({**entry, "status": "deleted"})
        except Exception as exc:  # noqa: BLE001
            results.append({**entry, "status": "error", "error": str(exc)})
    return results


def plan_pq_deletion(
    client: GeocachingClient,
    backup: dict,
    only_names: list[str] | None = None,
    only_guids: list[str] | None = None,
) -> dict:
    """Loeschplan fuer Pocket Queries, abgesichert gegen das PQ-Backup."""
    backed_up_guids = {
        pq["guid"] for pq in backup.get("pocket_queries", []) if pq.get("guid")
    }
    name_filter = {_norm(n) for n in only_names} if only_names else None
    guid_filter = set(only_guids) if only_guids else None

    to_delete: list[dict] = []
    not_in_backup: list[dict] = []

    for live in client.get_pocket_queries():
        guid = live.get("guid")
        name = live.get("name")
        entry = {"guid": guid, "name": name}
        if guid_filter is not None and guid not in guid_filter:
            continue
        if name_filter is not None and _norm(name) not in name_filter:
            continue
        if guid in backed_up_guids:
            to_delete.append(entry)
        else:
            not_in_backup.append(entry)

    return {"to_delete": to_delete, "not_in_backup": not_in_backup}


def execute_pq_deletion(
    client: GeocachingClient, plan: dict, progress: Progress = _noop
) -> list[dict]:
    results: list[dict] = []
    for entry in plan["to_delete"]:
        guid = entry["guid"]
        try:
            progress(f"Loesche Pocket Query '{entry['name']}' ({guid}) ...")
            ok = client.delete_pocket_query(guid)
            results.append({**entry, "status": "deleted" if ok else "not_confirmed"})
        except Exception as exc:  # noqa: BLE001
            results.append({**entry, "status": "error", "error": str(exc)})
    return results
