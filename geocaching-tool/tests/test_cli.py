import json

import pytest
import responses

from gctool import cli
from gctool import backup as backup_mod

API = "https://www.geocaching.com/api/proxy/web/v1"


def _write_backup(tmp_path):
    data = {
        "schema": backup_mod.LISTS_BACKUP_SCHEMA,
        "version": 1,
        "lists": [{"referenceCode": "BM1", "name": "Eins", "geocacheCount": 2,
                   "geocaches": [{"referenceCode": "GC1"}, {"referenceCode": "GC2"}]}],
    }
    path = tmp_path / "lists-backup.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    return path


@responses.activate
def test_cli_delete_dry_run_makes_no_delete(tmp_path, capsys):
    path = _write_backup(tmp_path)
    responses.get(API + "/lists", json=[{"referenceCode": "BM1", "name": "Eins", "count": 2}])
    rc = cli.main(["--cookie", "TOK", "lists", "delete", "--backup", str(path)])
    out = capsys.readouterr().out
    assert rc == 0
    assert "TROCKENLAUF" in out
    assert all(c.request.method == "GET" for c in responses.calls)


@responses.activate
def test_cli_delete_with_yes_deletes(tmp_path, capsys):
    path = _write_backup(tmp_path)
    responses.get(API + "/lists", json=[{"referenceCode": "BM1", "name": "Eins", "count": 2}])
    responses.delete(API + "/lists/BM1", status=204)
    rc = cli.main(["--cookie", "TOK", "lists", "delete", "--backup", str(path), "--yes"])
    out = capsys.readouterr().out
    assert rc == 0
    assert "Geloescht: 1/1" in out
    assert any(c.request.method == "DELETE" for c in responses.calls)


@responses.activate
def test_cli_delete_never_touches_unbackuped(tmp_path, capsys):
    path = _write_backup(tmp_path)
    # Live hat eine zusaetzliche Liste BM9, die NICHT im Backup ist.
    responses.get(API + "/lists", json=[
        {"referenceCode": "BM1", "name": "Eins", "count": 2},
        {"referenceCode": "BM9", "name": "Fremd", "count": 7},
    ])
    responses.delete(API + "/lists/BM1", status=204)
    cli.main(["--cookie", "TOK", "lists", "delete", "--backup", str(path), "--yes"])
    deleted = [c.request.url for c in responses.calls if c.request.method == "DELETE"]
    assert deleted == [API + "/lists/BM1"]  # BM9 wird nie geloescht


def test_cli_missing_cookie_exits(monkeypatch, capsys):
    monkeypatch.setattr(cli, "resolve_cookie", lambda *a, **k: None)
    with pytest.raises(SystemExit) as exc:
        cli.main(["lists", "show"])
    assert exc.value.code == 2
