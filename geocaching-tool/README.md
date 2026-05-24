# gctool — geocaching.com Listen- & Pocket-Query-Manager

Ein Kommandozeilen-Tool, um **Lesezeichen-Listen** (bookmark lists) und
**Pocket Queries** auf geocaching.com zu **sichern**, **kontrolliert zu löschen**
und später **wiederherzustellen**.

Gedacht für den Fall: „Ich will erstmal alles aufräumen/löschen, aber vorher ein
Backup machen, damit ich die Listen jederzeit wieder anlegen kann."

## Wie es funktioniert (und was du wissen musst)

- geocaching.com hat **keine offene Personal-API**. Das Tool spricht dieselben
  internen Web-Endpunkte an, die auch die Website selbst nutzt, und meldet sich
  über dein **Browser-Session-Cookie** (`gspkauth`) an. Kein Passwort wird
  gespeichert oder verschickt.
- Die Endpunkte sind **reverse-engineered** und können sich ändern. Wenn etwas
  klemmt: `gctool diagnose` ausführen — das prüft den Login und legt die
  Roh-Antworten ab.
- Listen-Funktionen brauchen eine **Premium-Mitgliedschaft** (Pocket Queries
  ebenso).
- Wiederhergestellte Listen bekommen **neue Referenzcodes** (die alten `BM…`-Codes
  lassen sich nicht erzwingen). Name, Beschreibung und enthaltene Caches bleiben
  erhalten — die Liste ist also wieder voll nutzbar.

## Sicherheitsprinzip

> **Es wird nur gelöscht, was nachweislich im Backup liegt.**

- Jeder `delete`-Befehl braucht ein Backup als Anker (`--backup`). Listen, die
  nicht im Backup stehen, werden **nie** angefasst.
- `delete` ist standardmäßig ein **Trockenlauf**. Erst `--yes` löscht wirklich.
- Vor dem Löschen wird die **Cache-Anzahl** zwischen Server und Backup verglichen.
  Bei Abweichung wird die Liste übersprungen (Backup evtl. unvollständig), außer
  du erzwingst es mit `--force-count-mismatch`.

## Installation

```bash
cd geocaching-tool
python3 -m venv .venv
. .venv/bin/activate
pip install -e .
```

Danach steht der Befehl `gctool` zur Verfügung (alternativ `python -m gctool`).

## Cookie holen (einmalig)

1. Im Browser bei geocaching.com **einloggen**.
2. DevTools öffnen (F12) → **Application** (Chrome) bzw. **Storage** (Firefox)
   → **Cookies** → `https://www.geocaching.com`.
3. Den Wert des Cookies **`gspkauth`** kopieren.
4. Dem Tool übergeben — eine der drei Varianten:
   - Flag: `gctool --cookie 'DEIN_WERT' lists show`
   - Umgebungsvariable: `export GC_COOKIE='DEIN_WERT'`
   - Datei: Wert in `~/.gctool/cookie.txt` speichern.

Du kannst statt nur des Werts auch den **kompletten Cookie-Header** einfügen
(`gspkauth=…; …`) — das Tool zieht sich `gspkauth` selbst heraus.

> Das Cookie ist so sensibel wie dein Login. Nicht weitergeben, nicht
> committen (die mitgelieferte `.gitignore` schützt davor).

## Typischer Ablauf: alles sichern, dann löschen, später wiederherstellen

```bash
# 0. Verbindung & Endpunkte prüfen
gctool diagnose

# 1. Anschauen, was da ist
gctool lists show
gctool pq show

# 2. BACKUP (zuerst!)
gctool lists backup -o gc-backup/lists-backup.json
gctool pq    backup -o gc-backup/pocket-queries

# 3. Löschen — erst Trockenlauf ansehen ...
gctool lists delete --backup gc-backup/lists-backup.json
# ... dann wirklich löschen
gctool lists delete --backup gc-backup/lists-backup.json --yes

# 4. Später wieder anlegen
gctool lists restore --backup gc-backup/lists-backup.json          # Trockenlauf
gctool lists restore --backup gc-backup/lists-backup.json --yes    # wirklich
```

## Befehle

| Befehl | Zweck |
| --- | --- |
| `gctool diagnose` | Login prüfen, Roh-Antworten in `gc-diagnose/` ablegen |
| `gctool lists show [--type bm]` | Lesezeichen-Listen anzeigen |
| `gctool lists backup -o DATEI [--type bm] [--no-geocaches]` | Listen + Caches sichern |
| `gctool lists delete --backup DATEI [--name N] [--ref BM…] [--yes]` | Listen löschen (nur aus Backup) |
| `gctool lists restore --backup DATEI [--allow-duplicates] [--yes]` | Listen neu anlegen |
| `gctool pq show` | Pocket Queries anzeigen |
| `gctool pq backup -o ORDNER [--no-gpx] [--no-settings]` | PQs sichern (GPX + Einstellungen) |
| `gctool pq delete --backup ORDNER [--name N] [--guid G] [--yes]` | PQs löschen (experimentell) |

Auswahl eingrenzen: `--name` und `--ref`/`--guid` sind wiederholbar, z. B.
`--name "Urlaub" --name "NRW"`. Ohne Eingrenzung werden alle Einträge des Backups
berücksichtigt, die noch auf dem Server existieren.

## Pocket Queries — Stand der Dinge

- **`show` / `backup`**: solide. Das Backup lädt die **GPX-Ergebnisse** (als ZIP)
  jeder PQ herunter und speichert zusätzlich die **Einstellungs-Seite** als HTML,
  damit du die Filter notfalls manuell nachbauen kannst.
- **`delete`**: **experimentell**. geocaching.com bietet keinen sauberen Endpunkt
  dafür; das Tool bedient das klassische ASPX-Formular. Wenn es die nötigen
  Felder nicht findet, bricht es mit klarer Meldung ab (statt blind zu raten).
  Auch hier gilt: Backup-Pflicht + Trockenlauf + `--yes`.
- Ein automatisches **Wiederherstellen von PQs** gibt es bewusst nicht — PQ-Filter
  sind zu vielschichtig, um sie verlässlich zu reproduzieren. Nutze die
  gesicherte Einstellungs-HTML als Vorlage.

## Tests

```bash
pip install -e ".[dev]"
pytest
```

Die Tests mocken die HTTP-Aufrufe (`responses`) und prüfen u. a. Paginierung,
Backup-Format, Wiederherstellung und das **Lösch-Sicherheitsgating** (Trockenlauf
löscht nie; nichts außerhalb des Backups wird angefasst).

## Wenn etwas nicht klappt

1. `gctool diagnose` ausführen.
2. Liefert der Auth-Check `NEIN` → Cookie neu aus dem Browser holen (es läuft ab).
3. Bei API-Fehlern zeigt das Tool Status und Antwort-Auszug. Die in
   `gc-diagnose/` gespeicherten Roh-Antworten helfen, einen geänderten Endpunkt
   in `gctool/client.py` anzupassen (alle Pfade stehen dort als Konstanten).
