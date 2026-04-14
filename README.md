# 🧪 FlowTest — Full Stack

> Session recording → Auto-generated tests → Real user insights

## Stack

- **Frontend**: React 18 + Vite + Recharts
- **Backend**: Node.js (ESM) + Express
- **Database**: SQLite via better-sqlite3 (zero config, file-based)
- **Tracker**: Vanilla JS script (embed in any website)

## Project Structure

```
flowtest/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server
│   │   ├── db.js             # SQLite schema + connection
│   │   └── routes/
│   │       ├── dashboard.js  # Stats, chart, alerts
│   │       ├── sessions.js   # Session list + detail
│   │       ├── tests.js      # Test CRUD + run
│   │       ├── insights.js   # Funnel, rage clicks, suggestions
│   │       └── track.js      # Ingestion API for tracker script
│   └── scripts/
│       ├── seed.js           # Generates realistic demo data
│       └── tracker.js        # Client-side tracking script
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── hooks/useApi.js   # Data fetching hooks
│   │   └── components/
│   │       ├── layout/       # Sidebar
│   │       ├── dashboard/    # Stats + charts + alerts
│   │       ├── recordings/   # Session list + replay
│   │       ├── tests/        # Test runner + code view
│   │       ├── insights/     # Funnel + AI suggestions
│   │       ├── settings/     # API key + script + team
│   │       └── landing/      # Marketing page
│   └── vite.config.js
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd backend
npm install
npm run seed     # Creates SQLite DB with 200 sessions, 5 tests, alerts, insights
npm run dev      # Starts API on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # Starts on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Aggregate stats |
| GET | `/api/dashboard/chart` | 14-day drop-off chart |
| GET | `/api/dashboard/alerts` | Active alerts |
| PATCH | `/api/dashboard/alerts/:id/resolve` | Resolve alert |
| GET | `/api/sessions` | Paginated session list |
| GET | `/api/sessions/:id` | Session + events + page views |
| GET | `/api/tests` | All tests with run counts |
| GET | `/api/tests/:id` | Test + run history |
| POST | `/api/tests/:id/run` | Simulate a test run |
| GET | `/api/tests/:id/status` | Poll test run status |
| GET | `/api/insights` | Funnel, rage clicks, suggestions |
| POST | `/api/track/session/start` | Start new tracked session |
| POST | `/api/track/events` | Batch event ingestion |
| POST | `/api/track/session/end` | End session |

## Embed Tracker on Your Site

```html
<script
  src="http://localhost:3001/tracker.js"
  data-key="ft_live_xk9m2p4r8s1t7u3v6w0demo"
  data-url="http://localhost:3001">
</script>
```

Tracker auto-detects:
- 🖱 Clicks + rage clicks (5+ on same element)
- 📜 Scroll depth
- 📝 Form inputs
- 🔄 SPA route changes
- ❌ JavaScript errors
- 👁 Page visibility / session end

## Upgrade Path

| Feature | Status | Notes |
|---------|--------|-------|
| SQLite → PostgreSQL | Easy | Replace better-sqlite3 with `pg` |
| Real Playwright runner | Medium | Add `@playwright/test` subprocess |
| Live replay (rrweb) | Medium | Replace mock player with rrweb |
| AI insights (OpenAI) | Medium | Call GPT-4 on session summaries |
| Auth (JWT) | Easy | Add middleware to all routes |
| Multi-project | Done | Schema supports it |
# FlowTest
