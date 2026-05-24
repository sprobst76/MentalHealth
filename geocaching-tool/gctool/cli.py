"""Kommandozeilen-Schnittstelle fuer gctool."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import __version__, backup as backup_mod, deletion, restore as restore_mod
from .auth import build_session, has_auth_cookie
from .client import GCApiError, GeocachingClient
from .config import BASE_URL, DEFAULT_BACKUP_DIR, resolve_cookie


def _err(msg: str) -> None:
    print(msg, file=sys.stderr)


def _progress(msg: str) -> None:
    print(msg, file=sys.stderr)


def _make_client(args) -> GeocachingClient:
    cookie = resolve_cookie(args.cookie, args.cookie_file)
    if not cookie:
        _err(
            "Kein Auth-Cookie gefunden.\n"
            "Logge dich im Browser bei geocaching.com ein, kopiere den Wert des\n"
            "'gspkauth'-Cookies (DevTools > Application > Cookies) und uebergib ihn via:\n"
            "  --cookie '<wert>'   oder\n"
            "  Umgebungsvariable GC_COOKIE   oder\n"
            f"  Datei {DEFAULT_BACKUP_DIR.parent / 'cookie.txt'}\n"
            "Details: README.md"
        )
        raise SystemExit(2)
    session = build_session(cookie)
    if not has_auth_cookie(session):
        _err("Warnung: Im Cookie wurde kein 'gspkauth' erkannt - Login schlaegt evtl. fehl.")
    return GeocachingClient(session, base_url=args.base_url, timeout=args.timeout)


# --------------------------------------------------------------------------
# Befehle
# --------------------------------------------------------------------------

def cmd_diagnose(args) -> int:
    client = _make_client(args)
    out_dir = Path(args.debug_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    print("== Auth-Check ==")
    try:
        ok = client.check_auth()
        print(f"Listen-Endpunkt erreichbar & autorisiert: {'JA' if ok else 'NEIN'}")
    except GCApiError as exc:
        print(f"Fehler beim Auth-Check: {exc}")
        ok = False

    print("\n== Lesezeichen-Listen ==")
    try:
        lists = client.get_lists()
        print(f"Gefundene Listen: {len(lists)}")
        if lists:
            sample = lists[0]
            print("Felder des ersten Eintrags:", ", ".join(sorted(sample.keys())))
            (out_dir / "lists-sample.json").write_text(
                json.dumps(lists[:5], ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            print(f"Beispiel gespeichert: {out_dir / 'lists-sample.json'}")
    except GCApiError as exc:
        print(f"Fehler: {exc}")

    print("\n== Pocket Queries ==")
    try:
        html = client.fetch_pq_page()
        (out_dir / "pq-page.html").write_text(html, encoding="utf-8")
        pqs = client.get_pocket_queries()
        print(f"Gefundene Pocket Queries: {len(pqs)}")
        print(f"Roh-HTML gespeichert: {out_dir / 'pq-page.html'}")
        for pq in pqs[:10]:
            print(f"  - {pq['name']} ({pq['guid']})")
    except GCApiError as exc:
        print(f"Fehler: {exc}")
    return 0 if ok else 1


def cmd_lists_show(args) -> int:
    client = _make_client(args)
    lists = client.get_lists(list_type=args.type)
    if not lists:
        print("Keine Listen gefunden.")
        return 0
    rows = [("Name", "Ref", "Typ", "Caches")]
    for lst in lists:
        rows.append(
            (
                str(lst.get("name") or ""),
                str(lst.get("referenceCode") or ""),
                str(lst.get("type") or ""),
                str(lst.get("count") if lst.get("count") is not None else "?"),
            )
        )
    _print_table(rows)
    print(f"\n{len(lists)} Liste(n).")
    return 0


def cmd_lists_backup(args) -> int:
    client = _make_client(args)
    data = backup_mod.backup_lists(
        client, list_type=args.type, with_geocaches=not args.no_geocaches, progress=_progress
    )
    out = Path(args.output) if args.output else DEFAULT_BACKUP_DIR / "lists-backup.json"
    backup_mod.write_lists_backup(data, out)
    total_caches = sum(l["geocacheCount"] for l in data["lists"])
    print(f"Backup geschrieben: {out.resolve()}")
    print(f"{data['count']} Liste(n), {total_caches} Geocache-Eintraege gesichert.")
    return 0


def cmd_lists_delete(args) -> int:
    client = _make_client(args)
    backup = backup_mod.load_lists_backup(args.backup)
    plan = deletion.plan_list_deletion(
        client,
        backup,
        only_names=args.name or None,
        only_refs=args.ref or None,
        ignore_count_mismatch=args.force_count_mismatch,
    )

    if plan["not_in_backup"]:
        print("Uebersprungen (NICHT im Backup, wird nie geloescht):")
        for e in plan["not_in_backup"]:
            print(f"  - {e['name']} ({e['referenceCode']})")
    if plan["count_mismatch"]:
        print("Uebersprungen (Cache-Anzahl weicht vom Backup ab - --force-count-mismatch zum Erzwingen):")
        for e in plan["count_mismatch"]:
            print(f"  - {e['name']} ({e['referenceCode']}): live={e['liveCount']} backup={e.get('backupCount')}")

    targets = plan["to_delete"]
    if not targets:
        print("Nichts zu loeschen.")
        return 0

    print("\nZu loeschende Listen (alle im Backup gesichert):")
    for e in targets:
        print(f"  - {e['name']} ({e['referenceCode']}), {e.get('liveCount')} Caches")

    if not args.yes:
        print(f"\nTROCKENLAUF: {len(targets)} Liste(n) wuerden geloescht. Mit --yes ausfuehren.")
        return 0

    results = deletion.execute_list_deletion(client, plan, progress=_progress)
    deleted = sum(1 for r in results if r["status"] == "deleted")
    errors = [r for r in results if r["status"] == "error"]
    print(f"\nGeloescht: {deleted}/{len(targets)}.")
    for r in errors:
        _err(f"  Fehler bei {r['name']} ({r['referenceCode']}): {r.get('error')}")
    return 1 if errors else 0


def cmd_lists_restore(args) -> int:
    client = _make_client(args)
    backup = backup_mod.load_lists_backup(args.backup)
    results = restore_mod.restore_lists(
        client,
        backup,
        allow_duplicates=args.allow_duplicates,
        dry_run=not args.yes,
        progress=_progress,
    )
    for r in results:
        print(f"  [{r['status']}] {r['name']} ({r['geocaches']} Caches)"
              + (f" -> {r['referenceCode']}" if r.get("referenceCode") else ""))
    if not args.yes:
        creatable = sum(1 for r in results if r["status"] == "would_create")
        print(f"\nTROCKENLAUF: {creatable} Liste(n) wuerden angelegt. Mit --yes ausfuehren.")
    else:
        created = sum(1 for r in results if r["status"] == "created")
        print(f"\nAngelegt: {created} Liste(n).")
    return 0


def cmd_pq_show(args) -> int:
    client = _make_client(args)
    pqs = client.get_pocket_queries()
    if not pqs:
        print("Keine Pocket Queries gefunden.")
        return 0
    rows = [("Name", "GUID")]
    for pq in pqs:
        rows.append((str(pq.get("name") or ""), str(pq.get("guid") or "")))
    _print_table(rows)
    print(f"\n{len(pqs)} Pocket Query/Queries.")
    return 0


def cmd_pq_backup(args) -> int:
    client = _make_client(args)
    out = Path(args.output) if args.output else DEFAULT_BACKUP_DIR / "pocket-queries"
    index = backup_mod.backup_pocket_queries(
        client,
        out,
        download_gpx=not args.no_gpx,
        save_settings=not args.no_settings,
        progress=_progress,
    )
    print(f"PQ-Backup geschrieben: {out.resolve()}")
    print(f"{index['count']} Pocket Query/Queries gesichert.")
    errors = [pq for pq in index["pocket_queries"] if pq.get("gpx_error") or pq.get("settings_error")]
    for pq in errors:
        _err(f"  Teilfehler bei '{pq['name']}': {pq.get('gpx_error') or ''} {pq.get('settings_error') or ''}")
    return 0


def cmd_pq_delete(args) -> int:
    client = _make_client(args)
    backup = backup_mod.load_pq_backup(args.backup)
    plan = deletion.plan_pq_deletion(
        client, backup, only_names=args.name or None, only_guids=args.guid or None
    )
    if plan["not_in_backup"]:
        print("Uebersprungen (NICHT im Backup):")
        for e in plan["not_in_backup"]:
            print(f"  - {e['name']} ({e['guid']})")
    targets = plan["to_delete"]
    if not targets:
        print("Nichts zu loeschen.")
        return 0
    print("\nZu loeschende Pocket Queries (im Backup gesichert):")
    for e in targets:
        print(f"  - {e['name']} ({e['guid']})")
    if not args.yes:
        print(f"\nTROCKENLAUF: {len(targets)} PQ(s) wuerden geloescht. Mit --yes ausfuehren.")
        print("Hinweis: PQ-Loeschen ist EXPERIMENTELL (kein offizieller Endpunkt).")
        return 0
    results = deletion.execute_pq_deletion(client, plan, progress=_progress)
    deleted = sum(1 for r in results if r["status"] == "deleted")
    print(f"\nGeloescht: {deleted}/{len(targets)}.")
    for r in results:
        if r["status"] != "deleted":
            _err(f"  {r['name']} ({r['guid']}): {r['status']} {r.get('error', '')}")
    return 0


# --------------------------------------------------------------------------
# Hilfsfunktionen / Parser
# --------------------------------------------------------------------------

def _print_table(rows: list[tuple]) -> None:
    widths = [max(len(r[i]) for r in rows) for i in range(len(rows[0]))]
    for idx, row in enumerate(rows):
        line = "  ".join(cell.ljust(widths[i]) for i, cell in enumerate(row))
        print(line)
        if idx == 0:
            print("  ".join("-" * widths[i] for i in range(len(row))))


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="gctool",
        description="Backup, Loeschen und Wiederherstellen von geocaching.com "
        "Lesezeichen-Listen und Pocket Queries.",
    )
    p.add_argument("--version", action="version", version=f"gctool {__version__}")
    p.add_argument("--cookie", help="gspkauth-Cookie-Wert oder kompletter Cookie-Header.")
    p.add_argument("--cookie-file", help="Datei mit dem Cookie.")
    p.add_argument("--base-url", default=BASE_URL, help="Basis-URL (Standard: %(default)s).")
    p.add_argument("--timeout", type=int, default=30, help="HTTP-Timeout in Sekunden.")

    sub = p.add_subparsers(dest="command", required=True)

    dgn = sub.add_parser("diagnose", help="Auth pruefen und Roh-Antworten speichern.")
    dgn.add_argument("--debug-dir", default="gc-diagnose", help="Zielordner fuer Roh-Antworten.")
    dgn.set_defaults(func=cmd_diagnose)

    # ---- lists ----
    lists = sub.add_parser("lists", help="Lesezeichen-Listen verwalten.").add_subparsers(
        dest="subcommand", required=True
    )

    sp = lists.add_parser("show", help="Listen anzeigen.")
    sp.add_argument("--type", help="Nach Typ filtern (z. B. bm).")
    sp.set_defaults(func=cmd_lists_show)

    sp = lists.add_parser("backup", help="Listen sichern (inkl. Geocaches).")
    sp.add_argument("-o", "--output", help="Ziel-JSON-Datei.")
    sp.add_argument("--type", help="Nur Listen dieses Typs sichern.")
    sp.add_argument("--no-geocaches", action="store_true", help="Nur Metadaten, ohne Geocaches.")
    sp.set_defaults(func=cmd_lists_backup)

    sp = lists.add_parser("delete", help="Listen loeschen (nur was im Backup steht).")
    sp.add_argument("--backup", required=True, help="Backup-JSON als Sicherheitsanker.")
    sp.add_argument("--name", action="append", help="Nur diese Namen (wiederholbar).")
    sp.add_argument("--ref", action="append", help="Nur diese Referenzcodes (wiederholbar).")
    sp.add_argument("--force-count-mismatch", action="store_true",
                    help="Auch loeschen, wenn die Cache-Anzahl vom Backup abweicht.")
    sp.add_argument("--yes", action="store_true", help="Wirklich loeschen (sonst Trockenlauf).")
    sp.set_defaults(func=cmd_lists_delete)

    sp = lists.add_parser("restore", help="Listen aus Backup neu anlegen.")
    sp.add_argument("--backup", required=True, help="Backup-JSON.")
    sp.add_argument("--allow-duplicates", action="store_true",
                    help="Auch anlegen, wenn schon eine Liste mit dem Namen existiert.")
    sp.add_argument("--yes", action="store_true", help="Wirklich anlegen (sonst Trockenlauf).")
    sp.set_defaults(func=cmd_lists_restore)

    # ---- pq ----
    pq = sub.add_parser("pq", help="Pocket Queries verwalten.").add_subparsers(
        dest="subcommand", required=True
    )

    sp = pq.add_parser("show", help="Pocket Queries anzeigen.")
    sp.set_defaults(func=cmd_pq_show)

    sp = pq.add_parser("backup", help="PQs sichern (GPX-Download + Einstellungen).")
    sp.add_argument("-o", "--output", help="Ziel-Verzeichnis.")
    sp.add_argument("--no-gpx", action="store_true", help="GPX-Ergebnisse nicht herunterladen.")
    sp.add_argument("--no-settings", action="store_true", help="Einstellungs-HTML nicht sichern.")
    sp.set_defaults(func=cmd_pq_backup)

    sp = pq.add_parser("delete", help="PQs loeschen (EXPERIMENTELL, nur was im Backup steht).")
    sp.add_argument("--backup", required=True, help="PQ-Backup-Verzeichnis als Sicherheitsanker.")
    sp.add_argument("--name", action="append", help="Nur diese Namen (wiederholbar).")
    sp.add_argument("--guid", action="append", help="Nur diese GUIDs (wiederholbar).")
    sp.add_argument("--yes", action="store_true", help="Wirklich loeschen (sonst Trockenlauf).")
    sp.set_defaults(func=cmd_pq_delete)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except GCApiError as exc:
        _err(f"\nAPI-Fehler: {exc}")
        _err("Tipp: `gctool diagnose` ausfuehren und ggf. Cookie erneuern.")
        return 1
    except (ValueError, FileNotFoundError) as exc:
        _err(f"\nFehler: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
