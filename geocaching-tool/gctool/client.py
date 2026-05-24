"""Client fuer die internen geocaching.com Web-Endpunkte.

Alle Pfade stehen als Konstanten oben, damit sie an einer Stelle angepasst
werden koennen, falls geocaching.com etwas aendert. Die Listen-Endpunkte
spiegeln die offizielle API (`/v1/lists/...`); Pocket Queries werden ueber die
klassische ASPX-Seite gelesen (es gibt dafuer keine saubere JSON-API).
"""
from __future__ import annotations

import re
from typing import Any, Iterator
from urllib.parse import urljoin

import requests

from .config import BASE_URL

try:  # BeautifulSoup nur fuer Pocket Queries noetig
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover
    BeautifulSoup = None  # type: ignore


class GCApiError(RuntimeError):
    """HTTP-Fehler mit Status und (gekuerztem) Antworttext fuer schnelle Diagnose."""

    def __init__(self, method: str, url: str, status: int, body: str | None):
        self.method = method
        self.url = url
        self.status = status
        self.body = body or ""
        snippet = self.body[:600]
        super().__init__(f"{method} {url} -> HTTP {status}\n{snippet}")


class GeocachingClient:
    def __init__(self, session: requests.Session, base_url: str = BASE_URL, timeout: int = 30):
        self.session = session
        self.base = base_url.rstrip("/")
        self.web_api = self.base + "/api/proxy/web/v1"
        self.timeout = timeout

    # ---- Low-level -------------------------------------------------------

    def _request(
        self,
        method: str,
        url: str,
        *,
        params: dict | None = None,
        json: Any | None = None,
        expect_json: bool = True,
        allow: tuple[int, ...] = (200, 201, 204),
    ) -> Any:
        resp = self.session.request(
            method, url, params=params, json=json, timeout=self.timeout
        )
        if resp.status_code not in allow:
            raise GCApiError(method, resp.url, resp.status_code, resp.text)
        if not expect_json or resp.status_code == 204 or not resp.content:
            return None
        try:
            return resp.json()
        except ValueError:
            raise GCApiError(
                method, resp.url, resp.status_code,
                "Erwartete JSON, bekam:\n" + resp.text[:600],
            )

    @staticmethod
    def _unwrap(payload: Any) -> list:
        """Akzeptiert sowohl reine Arrays als auch {"data": [...]}-Wrapper."""
        if payload is None:
            return []
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            for key in ("data", "lists", "geocaches", "items"):
                if isinstance(payload.get(key), list):
                    return payload[key]
        return []

    # ---- Auth-Check ------------------------------------------------------

    def check_auth(self) -> bool:
        """True, wenn die Session gueltig ist (Listen-Endpunkt liefert 200)."""
        resp = self.session.get(
            self.web_api + "/lists", params={"take": 1, "skip": 0}, timeout=self.timeout
        )
        return resp.status_code == 200

    # ---- Lesezeichen-Listen ---------------------------------------------

    def iter_lists(self, list_type: str | None = None, page_size: int = 50) -> Iterator[dict]:
        skip = 0
        while True:
            params: dict[str, Any] = {"take": page_size, "skip": skip}
            if list_type:
                params["type"] = list_type
            items = self._unwrap(self._request("GET", self.web_api + "/lists", params=params))
            if not items:
                break
            yield from items
            if len(items) < page_size:
                break
            skip += page_size

    def get_lists(self, list_type: str | None = None) -> list[dict]:
        return list(self.iter_lists(list_type=list_type))

    def get_list_geocaches(self, reference_code: str, page_size: int = 50) -> list[dict]:
        out: list[dict] = []
        skip = 0
        url = f"{self.web_api}/lists/{reference_code}/geocaches"
        while True:
            items = self._unwrap(
                self._request("GET", url, params={"take": page_size, "skip": skip})
            )
            if not items:
                break
            out.extend(items)
            if len(items) < page_size:
                break
            skip += page_size
        return out

    def create_list(
        self,
        name: str,
        description: str = "",
        list_type: str = "bm",
        is_public: bool = False,
        is_shared: bool = False,
    ) -> dict:
        body = {
            "name": name,
            "description": description or "",
            "type": list_type,
            "isPublic": bool(is_public),
            "isShared": bool(is_shared),
        }
        return self._request("POST", self.web_api + "/lists", json=body)

    def add_geocaches(self, reference_code: str, gc_codes: list[str]) -> Any:
        """Fuegt Geocaches per Bulk-Endpunkt hinzu (max. 1000 pro Liste)."""
        if not gc_codes:
            return None
        body = [{"referenceCode": code} for code in gc_codes]
        return self._request(
            "POST", f"{self.web_api}/lists/{reference_code}/bulkgeocaches", json=body
        )

    def delete_list(self, reference_code: str) -> None:
        self._request(
            "DELETE",
            f"{self.web_api}/lists/{reference_code}",
            expect_json=False,
            allow=(200, 204),
        )

    # ---- Pocket Queries (ueber die klassische ASPX-Seite) ----------------

    PQ_PAGE = "/pocket/default.aspx"
    PQ_DOWNLOAD = "/pocket/downloadpq.ashx"
    PQ_EDIT = "/pocket/gcquery.aspx"

    def fetch_pq_page(self) -> str:
        resp = self.session.get(self.base + self.PQ_PAGE, timeout=self.timeout)
        if resp.status_code != 200:
            raise GCApiError("GET", resp.url, resp.status_code, resp.text)
        return resp.text

    def get_pocket_queries(self) -> list[dict]:
        return parse_pq_list(self.fetch_pq_page(), self.base)

    def download_pocket_query(self, guid: str, dest_path: str) -> str:
        resp = self.session.get(
            self.base + self.PQ_DOWNLOAD,
            params={"g": guid, "src": "web"},
            timeout=self.timeout,
            stream=True,
        )
        if resp.status_code != 200:
            raise GCApiError("GET", resp.url, resp.status_code, resp.text[:600] if resp.text else "")
        with open(dest_path, "wb") as fh:
            for chunk in resp.iter_content(8192):
                if chunk:
                    fh.write(chunk)
        return dest_path

    def get_pq_settings_html(self, guid: str) -> str:
        resp = self.session.get(
            self.base + self.PQ_EDIT, params={"guid": guid}, timeout=self.timeout
        )
        if resp.status_code != 200:
            raise GCApiError("GET", resp.url, resp.status_code, resp.text)
        return resp.text

    def delete_pocket_query(self, guid: str) -> bool:
        """EXPERIMENTELL: Loescht eine Pocket Query ueber das ASPX-Formular.

        geocaching.com bietet keine saubere API zum Loeschen von PQs. Diese
        Methode liest das Formular der PQ-Seite, markiert die Ziel-PQ und
        sendet den Loeschen-Button mit. Findet sie die noetigen Felder nicht,
        wirft sie einen klaren Fehler (statt blind zu raten).
        """
        if BeautifulSoup is None:  # pragma: no cover
            raise RuntimeError("beautifulsoup4 ist nicht installiert.")

        html = self.fetch_pq_page()
        soup = BeautifulSoup(html, "html.parser")
        form = soup.find("form")
        if form is None:
            raise GCApiError("POST", self.base + self.PQ_PAGE, 0, "Kein <form> auf der PQ-Seite gefunden.")

        # Alle Formularfelder sammeln (inkl. __VIEWSTATE etc.).
        payload: dict[str, str] = {}
        for inp in form.find_all("input"):
            name = inp.get("name")
            if not name:
                continue
            itype = (inp.get("type") or "text").lower()
            if itype in ("checkbox", "radio"):
                if inp.get("checked") is not None:
                    payload[name] = inp.get("value", "on")
            elif itype == "submit":
                continue  # Submit-Buttons gezielt unten setzen
            else:
                payload[name] = inp.get("value", "")
        for sel in form.find_all("select"):
            name = sel.get("name")
            if not name:
                continue
            opt = sel.find("option", selected=True) or sel.find("option")
            if opt is not None:
                payload[name] = opt.get("value", "")

        # Die Checkbox der Ziel-PQ finden: ihre Zeile enthaelt den Download-Link mit guid.
        row = _find_pq_row(soup, guid)
        if row is None:
            raise GCApiError("POST", self.base + self.PQ_PAGE, 0, f"PQ-Zeile fuer guid {guid} nicht gefunden.")
        checkbox = row.find("input", {"type": "checkbox"})
        if checkbox is None or not checkbox.get("name"):
            raise GCApiError(
                "POST", self.base + self.PQ_PAGE, 0,
                "Keine Auswahl-Checkbox in der PQ-Zeile gefunden. Bitte `gctool diagnose` ausfuehren.",
            )
        payload[checkbox["name"]] = checkbox.get("value", "on")

        # Loesch-Button finden (Wert/Name enthaelt 'delete').
        delete_btn = None
        for inp in form.find_all("input", {"type": "submit"}):
            blob = f"{inp.get('name', '')} {inp.get('value', '')}".lower()
            if "delete" in blob or "loesch" in blob or "lösch" in blob:
                delete_btn = inp
                break
        if delete_btn is None or not delete_btn.get("name"):
            raise GCApiError(
                "POST", self.base + self.PQ_PAGE, 0,
                "Kein Loeschen-Button im Formular gefunden. Bitte `gctool diagnose` ausfuehren.",
            )
        payload[delete_btn["name"]] = delete_btn.get("value", "Delete")

        action = form.get("action") or self.PQ_PAGE
        post_url = urljoin(self.base + self.PQ_PAGE, action)
        resp = self.session.post(post_url, data=payload, timeout=self.timeout)
        if resp.status_code not in (200, 302):
            raise GCApiError("POST", resp.url, resp.status_code, resp.text[:600])

        # Verifizieren: guid sollte verschwunden sein.
        remaining = {pq.get("guid") for pq in parse_pq_list(self.fetch_pq_page(), self.base)}
        return guid not in remaining


# ---- HTML-Parsing fuer Pocket Queries ------------------------------------

_GUID_RE = re.compile(r"[?&]g=([0-9a-fA-F-]{36})")


def _find_pq_row(soup, guid: str):
    for a in soup.find_all("a", href=True):
        if "downloadpq.ashx" in a["href"] and guid in a["href"]:
            return a.find_parent("tr")
    return None


def parse_pq_list(html: str, base_url: str) -> list[dict]:
    """Liest die Pocket-Query-Tabelle. Best-effort, defensiv gegen Layoutaenderungen."""
    if BeautifulSoup is None:  # pragma: no cover
        raise RuntimeError("beautifulsoup4 ist nicht installiert.")
    soup = BeautifulSoup(html, "html.parser")
    found: dict[str, dict] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "downloadpq.ashx" not in href:
            continue
        m = _GUID_RE.search(href)
        guid = m.group(1) if m else None
        if not guid:
            continue
        name = None
        row = a.find_parent("tr")
        if row is not None:
            edit = row.find("a", href=lambda h: h and "gcquery.aspx" in h)
            if edit is not None:
                name = edit.get_text(strip=True)
            if not name:
                # Fallback: erster nicht-leerer Zellentext.
                for cell in row.find_all("td"):
                    text = cell.get_text(strip=True)
                    if text:
                        name = text
                        break
        found[guid] = {
            "guid": guid,
            "name": name or guid,
            "download_url": urljoin(base_url, href),
            "edit_url": urljoin(base_url, f"/pocket/gcquery.aspx?guid={guid}"),
        }
    return list(found.values())
