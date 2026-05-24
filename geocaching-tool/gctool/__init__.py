"""gctool - Backup, Loeschen und Wiederherstellen von geocaching.com Lesezeichen-Listen und Pocket Queries.

Das Tool arbeitet ueber die internen Web-Endpunkte von geocaching.com und
authentifiziert sich ueber das Browser-Session-Cookie (gspkauth). Es gibt keine
offizielle Personal-API; deshalb sind die Endpunkte reverse-engineered und koennen
sich aendern. Der Befehl `gctool diagnose` hilft, das im Zweifel zu pruefen.
"""

__version__ = "1.0.0"
