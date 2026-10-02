# ARHAM Fintech — BSE Exchange Trade Ingestion System

A production-grade, event-driven trade ingestion engine and real-time dashboard built for the **ARHAM Fintech Software Engineer Technical Assessment**.

![Architecture Flow](https://img.shields.io/badge/Architecture-Event--Driven-emerald)
![Protocol](https://img.shields.io/badge/Real--Time-WebSockets-blue)
![Database](https://img.shields.io/badge/Storage-SQLite-orange)

---

## 🎯 The Challenge & Scenario

- **BSE Exchange Pull Duration:** Up to **15 minutes**.
- **Enterprise Network Policy:** Kills any HTTP connection held open longer than **30 seconds**.
- **Assessment Deliverables:**
  1. **Mock BSE API:** `GET /getTrades` returning seeded trade data (Trade ID, Client, Symbol, Quantity, Price, Timestamp) with configurable delay (default 15 minutes).
  2. **Trades Dashboard:** Consumes `/getTrades`, opens instantly with cached trades even while a pull is running, and automatically updates when a pull completes with **no page refresh, no polling loop, and no cronjob/scheduler**.

---

## 🚀 Quick Start (One Command Run)

### 1. Prerequisites
- **Node.js** v20+ (v22/v25 recommended)
- **npm** v10+

### 2. Installation
```bash
git clone <repo-url>
cd "araham fintech"
npm install
```

### 3. Start All Services Concurrently
```bash
npm start
```
This runs all three services simultaneously via `concurrently`:
- **Mock BSE API:** `http://localhost:4000`
- **Backend & Ingestion Engine:** `http://localhost:5001` (WebSocket: `ws://localhost:5001/ws`)
- **Trades Dashboard UI:** `http://localhost:3000`

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 💻 Service Ports & Individual Run Commands

If you prefer running services in separate terminals:

| Service | Port | Command | Description |
|---|---|---|---|
| **Mock BSE API** | `4000` | `npm run dev:bse` | Seeded with 5,000 realistic trades, configurable delay |
| **Backend & WS** | `5001` | `npm run dev:server` | SQLite persistence, chunked worker, WebSockets |
| **Frontend UI** | `3000` | `npm run dev:client` | React + Vite + Tailwind dashboard |

---

## 🔍 How Each Requirement is Satisfied

| Requirement | Implementation Detail |
|---|---|
| **Mock BSE API with `GET /getTrades`** | Implemented at `http://localhost:4000/getTrades`. Returns seeded trade data with trade ID, client code, BSE symbol, quantity, price, timestamp, and buy/sell side. |
| **Configurable Delay (15 min default)** | Default configured to `900` seconds (15 minutes). Can be switched directly in the UI (10s Fast Demo, 30s Medium, or 15 mins) or via `?delay=<seconds>` query parameter. |
| **Overcoming 30s Connection Timeout** | Ingestion worker pulls data using **sequential chunked windowing** (`page` & `limit`), ensuring each HTTP connection terminates in `< 2 seconds`, well below the 30-second kill threshold. |
| **Instant Dashboard Open** | Trades are persisted in local indexed SQLite (`data/trades.db`). When the dashboard opens, `GET /api/trades` renders existing trades in **`< 15ms`**. |
| **Usable During Active Pull** | SQLite transactions allow concurrent reads. The user can search, filter, and page through existing trades while a pull is actively running in the background. |
| **Automatic Updates upon Completion** | Backend broadcasts `PULL_COMPLETED` via **WebSockets**. The open dashboard receives the push and updates UI state smoothly with an emerald highlight on new trades. |
| **No Page Refresh, No Polling Loop, No Cronjob** | Zero `window.location.reload()`, zero `setInterval`/`setTimeout` HTTP polling loops, zero scheduled cron jobs. Completely event-driven. |

---

## 🧪 Demo & Verification Walkthrough

1. **Instant Open:** Open `http://localhost:3000`. Notice trades appear immediately with zero loading spinner delay.
2. **Select Demo Delay:** In the "Simulated BSE Pull Delay" selector, click **"10s (Fast Demo)"** for quick evaluation or **"15 Mins"** for full exchange duration.
3. **Trigger Pull:** Click **"Trigger BSE Pull"**.
   - Notice the live progress banner: batch index, last request duration (`~0.5s - 1.2s`, highlighting `< 30s limit`), progress bar, and ETA.
   - Notice you can still search and interact with existing trades in the table while the pull is active!
4. **Auto-Update Verification:**
   - Watch the screen when the pull finishes:
   - A success toast notification appears: *"🎉 Pull Completed! 5,000 trades synchronized..."*.
   - New trades appear immediately in the table with an emerald glow highlight.
   - **Check Browser DevTools Network tab:** Zero polling requests are made! Only the single persistent WebSocket connection handles the notification.

---

## 📐 Architecture Document

See **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** for detailed architecture diagrams, sequence diagrams, and design rationale.

---

## 📁 Repository Structure

```text
├── ARCHITECTURE.md          # Comprehensive architectural note & Mermaid diagrams
├── README.md                # Setup instructions & feature summary
├── VIDEO_WALKTHROUGH.md     # Step-by-step video script for submission
├── package.json             # Root scripts & dependencies
├── vite.config.ts           # Vite config with API and WS proxies
├── src/
│   ├── mock-bse/            # Mock BSE Exchange API service
│   │   ├── index.ts         # GET /getTrades, configurable delay, timeout handling
│   │   └── tradeGenerator.ts# Seeded 5,000 BSE trade data generator
│   ├── server/              # Backend server & Ingestion engine
│   │   ├── db.ts            # High-performance SQLite database (node:sqlite)
│   │   ├── ingestionWorker.ts # Chunked ingestion engine (< 30s connection window)
│   │   ├── websocketServer.ts # Real-time WebSocket broadcasting (/ws)
│   │   └── index.ts         # REST API endpoints & server entrypoint
│   └── client/              # React 19 + Tailwind CSS Frontend
│       ├── components/      # UI components (Navbar, Metrics, PullPanel, Table, Modal)
│       ├── hooks/           # WebSocket real-time hook
│       ├── App.tsx          # Main application component
│       └── main.tsx         # React root
└── data/                    # SQLite database storage (trades.db)
```
