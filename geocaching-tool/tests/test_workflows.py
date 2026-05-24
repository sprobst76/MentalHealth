import json

import responses

from gctool import backup as backup_mod
from gctool import deletion, restore
from gctool.auth import build_session
from gctool.client import GeocachingClient

API = "https://www.geocaching.com/api/proxy/web/v1"


def make_client():
    return GeocachingClient(build_session("TESTTOKEN"))


# ---- backup --------------------------------------------------------------

@responses.activate
def test_backup_lists_structure(tmp_path):
    responses.get(API + "/lists", json=[
        {"referenceCode": "BM1", "name": "Eins", "type": "bm", "count": 2, "isPublic": False},
    ])
    responses.get(API + "/lists/BM1/geocaches", json=[
        {"referenceCode": "GC1", "name": "Cache A"},
        {"referenceCode": "GC2", "name": "Cache B"},
    ])
    data = backup_mod.backup_lists(make_client())
    assert data["count"] == 1
    lst = data["lists"][0]
    assert lst["referenceCode"] == "BM1"
    assert lst["geocacheCount"] == 2
    assert lst["geocaches"][0]["referenceCode"] == "GC1"

    out = tmp_path / "b.json"
    backup_mod.write_lists_backup(data, out)
    reloaded = backup_mod.load_lists_backup(out)
    assert reloaded["lists"][0]["geocaches"][1]["referenceCode"] == "GC2"


# ---- restore -------------------------------------------------------------

def _backup_with_one_list():
    return {
        "schema": backup_mod.LISTS_BACKUP_SCHEMA,
        "version": 1,
        "lists": [
            {
                "referenceCode": "BMold",
                "name": "Wiederherstellen",
                "description": "desc",
                "type": "bm",
                "isPublic": False,
                "isShared": False,
                "geocacheCount": 2,
                "geocaches": [
                    {"referenceCode": "GC1", "name": "a"},
                    {"referenceCode": "GC2", "name": "b"},
                ],
            }
        ],
    }


@responses.activate
def test_restore_dry_run_makes_no_writes():
    responses.get(API + "/lists", json=[])  # existing names lookup
    results = restore.restore_lists(make_client(), _backup_with_one_list(), dry_run=True)
    assert results[0]["status"] == "would_create"
    # nur der GET-Aufruf, kein POST
    assert all(c.request.method == "GET" for c in responses.calls)


@responses.activate
def test_restore_creates_and_adds():
    responses.get(API + "/lists", json=[])
    responses.post(API + "/lists", json={"referenceCode": "BMnew"})
    added = {}

    def cb(request):
        added["body"] = json.loads(request.body)
        return (200, {}, json.dumps({"ok": True}))

    responses.add_callback(responses.POST, API + "/lists/BMnew/bulkgeocaches", callback=cb)
    results = restore.restore_lists(make_client(), _backup_with_one_list(), dry_run=False)
    assert results[0]["status"] == "created"
    assert results[0]["referenceCode"] == "BMnew"
    assert results[0]["geocaches"] == 2
    assert added["body"] == [{"referenceCode": "GC1"}, {"referenceCode": "GC2"}]


@responses.activate
def test_restore_skips_existing_name():
    responses.get(API + "/lists", json=[{"name": "Wiederherstellen", "referenceCode": "BMx"}])
    results = restore.restore_lists(make_client(), _backup_with_one_list(), dry_run=False)
    assert results[0]["status"] == "skipped_exists"


# ---- deletion safety -----------------------------------------------------

@responses.activate
def test_plan_deletion_safety_categories():
    # Live: BM1 (passt), BM2 (Anzahl weicht ab), BM3 (nicht im Backup)
    responses.get(API + "/lists", json=[
        {"referenceCode": "BM1", "name": "Eins", "count": 5},
        {"referenceCode": "BM2", "name": "Zwei", "count": 3},
        {"referenceCode": "BM3", "name": "Drei", "count": 1},
    ])
    backup = {
        "schema": backup_mod.LISTS_BACKUP_SCHEMA,
        "lists": [
            {"referenceCode": "BM1", "name": "Eins", "geocacheCount": 5},
            {"referenceCode": "BM2", "name": "Zwei", "geocacheCount": 99},
        ],
    }
    plan = deletion.plan_list_deletion(make_client(), backup)
    assert [e["referenceCode"] for e in plan["to_delete"]] == ["BM1"]
    assert [e["referenceCode"] for e in plan["count_mismatch"]] == ["BM2"]
    assert [e["referenceCode"] for e in plan["not_in_backup"]] == ["BM3"]


@responses.activate
def test_plan_deletion_force_mismatch_includes_it():
    responses.get(API + "/lists", json=[
        {"referenceCode": "BM2", "name": "Zwei", "count": 3},
    ])
    backup = {"schema": backup_mod.LISTS_BACKUP_SCHEMA,
              "lists": [{"referenceCode": "BM2", "name": "Zwei", "geocacheCount": 99}]}
    plan = deletion.plan_list_deletion(make_client(), backup, ignore_count_mismatch=True)
    assert [e["referenceCode"] for e in plan["to_delete"]] == ["BM2"]


@responses.activate
def test_execute_deletion_calls_delete():
    responses.delete(API + "/lists/BM1", status=204)
    plan = {"to_delete": [{"referenceCode": "BM1", "name": "Eins"}]}
    results = deletion.execute_list_deletion(make_client(), plan)
    assert results[0]["status"] == "deleted"
