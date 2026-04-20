# Kompass

Ein persönliches Reflexions-Werkzeug für kontinuierliche innere Arbeit — Werte,
Glaubenssätze, Schematherapie, ACT-Defusion, Ziele, Hindernisse.

## Schnellstart

```bash
cp .env.example .env
docker compose up -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000 (Swagger: /docs)

## Architektur

Siehe [`CLAUDE.md`](./CLAUDE.md) für den vollständigen Architektur-Leitfaden.
Kurzfassung: modulares Design, jedes Reflexions-Modul (Values, YSQ, Goals, …)
hat eigenes Schema, eigene Komponente, eigenen Summary-Block. Ein Registry auf
Backend- und Frontend-Seite hält sie zusammen.

## Entwicklung

Nativ (ohne Docker):

```bash
# Backend
cd backend
pip install -e .
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Referenz

Die ursprüngliche Single-File-HTML-Version liegt unter `reference/kompass.html`
und dient als inhaltlicher Anker beim Portieren weiterer Module.
