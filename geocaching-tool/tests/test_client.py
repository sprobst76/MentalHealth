import json
from urllib.parse import parse_qs, urlparse

import responses

from gctool.auth import build_session, parse_cookie_input
from gctool.client import GeocachingClient, parse_pq_list

API = "https://www.geocaching.com/api/proxy/web/v1"


def make_client():
    return GeocachingClient(build_session("TESTTOKEN"))


# ---- auth ----------------------------------------------------------------

def test_parse_cookie_raw_token():
    assert parse_cookie_input("abc123") == {"gspkauth": "abc123"}


def test_parse_cookie_full_header():
    parsed = parse_cookie_input("gspkauth=xyz; foo=bar; baz=1")
    assert parsed["gspkauth"] == "xyz"
    assert parsed["foo"] == "bar"
    assert parsed["baz"] == "1"


def test_build_session_sets_cookie():
    s = build_session("TOK")
    assert any(c.name == "gspkauth" and c.value == "TOK" for c in s.cookies)


# ---- lists ---------------------------------------------------------------

@responses.activate
def test_get_lists_paginates():
    total = 60

    def cb(request):
        qs = parse_qs(urlparse(request.url).query)
        skip, take = int(qs["skip"][0]), int(qs["take"][0])
        items = [
            {"referenceCode": f"BM{i}", "name": f"L{i}", "type": "bm", "count": i}
            for i in range(skip, min(skip + take, total))
        ]
        return (200, {}, json.dumps(items))

    responses.add_callback(responses.GET, API + "/lists", callback=cb,
                           content_type="application/json")
    lists = make_client().get_lists()
    assert len(lists) == total
    assert lists[0]["referenceCode"] == "BM0"


@responses.activate
def test_get_lists_unwraps_data_key():
    responses.get(API + "/lists",
                  json={"data": [{"referenceCode": "BM1", "name": "x", "type": "bm"}]})
    lists = make_client().get_lists()
    assert len(lists) == 1


@responses.activate
def test_get_list_geocaches_paginates():
    total = 30

    def cb(request):
        qs = parse_qs(urlparse(request.url).query)
        skip, take = int(qs["skip"][0]), int(qs["take"][0])
        items = [{"referenceCode": f"GC{i}", "name": f"c{i}"}
                 for i in range(skip, min(skip + take, total))]
        return (200, {}, json.dumps(items))

    responses.add_callback(responses.GET, API + "/lists/BM1/geocaches", callback=cb,
                           content_type="application/json")
    caches = make_client().get_list_geocaches("BM1")
    assert len(caches) == total


@responses.activate
def test_create_list_body():
    captured = {}

    def cb(request):
        captured["body"] = json.loads(request.body)
        return (200, {}, json.dumps({"referenceCode": "BMNEW"}))

    responses.add_callback(responses.POST, API + "/lists", callback=cb)
    out = make_client().create_list("Meine Liste", description="hallo")
    assert out["referenceCode"] == "BMNEW"
    assert captured["body"]["name"] == "Meine Liste"
    assert captured["body"]["type"] == "bm"
    assert captured["body"]["isPublic"] is False


@responses.activate
def test_add_geocaches_bulk_body():
    captured = {}

    def cb(request):
        captured["body"] = json.loads(request.body)
        return (200, {}, json.dumps({"ok": True}))

    responses.add_callback(responses.POST, API + "/lists/BM1/bulkgeocaches", callback=cb)
    make_client().add_geocaches("BM1", ["GC1", "GC2"])
    assert captured["body"] == [{"referenceCode": "GC1"}, {"referenceCode": "GC2"}]


@responses.activate
def test_delete_list_calls_delete():
    responses.delete(API + "/lists/BM1", status=204)
    make_client().delete_list("BM1")
    assert responses.calls[0].request.method == "DELETE"


@responses.activate
def test_check_auth_true_false():
    responses.get(API + "/lists", json=[], status=200)
    assert make_client().check_auth() is True
    responses.reset()
    responses.get(API + "/lists", status=401)
    assert make_client().check_auth() is False


# ---- pocket query parsing ------------------------------------------------

PQ_HTML = """
<html><body><form id="aspnetForm" action="default.aspx">
<table>
  <tr>
    <td><input type="checkbox" name="ctl00$cb1" value="on"></td>
    <td><a href="/pocket/gcquery.aspx?guid=11111111-1111-1111-1111-111111111111">Wochenende NRW</a></td>
    <td><a href="/pocket/downloadpq.ashx?g=11111111-1111-1111-1111-111111111111">Download</a></td>
  </tr>
  <tr>
    <td><input type="checkbox" name="ctl00$cb2" value="on"></td>
    <td><a href="/pocket/gcquery.aspx?guid=22222222-2222-2222-2222-222222222222">Urlaub</a></td>
    <td><a href="/pocket/downloadpq.ashx?g=22222222-2222-2222-2222-222222222222">Download</a></td>
  </tr>
</table></form></body></html>
"""


def test_parse_pq_list():
    pqs = parse_pq_list(PQ_HTML, "https://www.geocaching.com")
    by_name = {p["name"]: p for p in pqs}
    assert "Wochenende NRW" in by_name
    assert by_name["Wochenende NRW"]["guid"] == "11111111-1111-1111-1111-111111111111"
    assert by_name["Urlaub"]["download_url"].endswith(
        "downloadpq.ashx?g=22222222-2222-2222-2222-222222222222"
    )
    assert len(pqs) == 2
