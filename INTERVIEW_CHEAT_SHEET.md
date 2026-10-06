# 🚀 ARHAM FINTECH INTERVIEW CHEAT SHEET & SNAPSHOT
**Candidate:** Rohit Pujari | **Role:** Software Engineer Intern / Developer  
**Company:** ARHAM Fintech (Malad Office, Mumbai) | **Topic:** BSE Trade Ingestion System

---

## 📌 1. THE PROBLEM STATEMENT (In 3 Bullet Points)
- **Scenario:** Pulling trade data from BSE Exchange API takes up to **15 minutes**.
- **Constraint:** Corporate network kills any HTTP connection open longer than **30 seconds** (`504 Gateway Timeout`).
- **Goal:** Build Mock BSE API + Trades Dashboard that opens instantly (<15ms) and auto-updates with **zero page refresh, zero polling loop, zero cronjob**.

---

## 🏗️ 2. THE 3-TIER ARCHITECTURE
```
[Mock BSE API (:4000)]  <--- 1s Batches (<30s) ---  [Ingestion Engine & SQLite (:5001)]  === WebSockets (/ws) ===>  [React Dashboard (:3000)]
```
1. **Mock BSE API (`src/mock-bse/` - Port 4000):**
   - 5,000 realistic seeded trades (`tradeGenerator.ts`).
   - `GET /getTrades?page=1&limit=500&delay=10` with pagination.
2. **Backend & SQLite (`src/server/` - Port 5001):**
   - **Ingestion Worker:** Loops through batches in <1s each, completely avoiding 30s timeout.
   - **SQLite (`data/trades.db`):** Indexed storage (`symbol`, `client`, `timestamp`) enabling <15ms instant open.
   - **WebSocket Server:** Real-time push hub on `/ws`.
3. **Frontend Dashboard (`src/client/` - Port 3000):**
   - React 19 + Tailwind CSS light terminal UI.
   - Listens to WebSockets for `PULL_COMPLETED`.
   - New trades pop up with emerald glow without refresh or polling.

---

## 💡 3. CORE ANALOGY (For Non-Tech Explanation)
- **Godown (BSE API):** 10,000 parcels ready for delivery.
- **Security Guard (Network Firewall):** No truck can stay at the gate longer than 30 seconds.
- **Naive Dev:** Sends a huge truck for all parcels -> gets kicked out at 30 seconds.
- **Our Solution:** Sends 20 quick scooters picking 500 parcels in 1 second each -> 100% data delivered safely!

---

## 🔑 4. KEY CONCEPTS & DEFINITIONS
| Concept | Definition | Role in Project |
|---|---|---|
| **Chunked Ingestion** | Fetching data in small batches rather than one huge request. | Bypasses the 30-second connection timeout limit. |
| **WebSockets** | Two-way persistent pipe between client and server. | Pushes new trades to UI live with zero refresh. |
| **Polling Loop** | Client repeatedly asking server "any new data?" every 2s. | Strictly avoided; wastes bandwidth and CPU. |
| **Cron Job** | Time-based alarm clock (runs every X minutes). | Not used; our system is reactive and event-driven. |
| **Reverse Proxy** | Gatekeeper (Nginx/Cloudflare) enforcing timeouts. | The reason why connections >30s get killed. |
| **SQLite (`trades.db`)** | In-process embedded database in Node.js. | Instant <15ms load time on dashboard startup. |

---

## ⚡ 5. TOP 5 INTERVIEW QUESTIONS & QUICK ANSWERS
1. **How did you solve the 30s timeout?**  
   *Answer:* Partitioned the 15-minute pull into sequential chunks of 500 records. Each request finishes in ~1s, well below the 30s ceiling.
2. **Why does the dashboard open instantly?**  
   *Answer:* It reads from local indexed SQLite (`data/trades.db`) in <15ms rather than waiting for BSE exchange latency.
3. **How does real-time update work without refresh or polling?**  
   *Answer:* The backend emits a `PULL_COMPLETED` event over persistent WebSockets (`/ws`), and React updates the state silently with a green glow highlight.
4. **What if data volume was 1 Lakh records?**  
   *Answer:* We scale batch size to 2,500–5,000 records (~2s per round), run 40 rounds, and frontend pagination (50/page) prevents DOM freezing.
5. **What changes if given the real BSE API?**  
   *Answer:* Only one environment variable (`BSE_API_URL`). The ingestion worker, SQLite persistence, and WebSocket UI work out-of-the-box.

---

## 💻 6. RUN COMMAND
```bash
cd "/Users/rohitpujari/CODING /Projects/araham fintech " && npm start
# Dashboard: http://localhost:3000
# Repo: https://github.com/Rodevops07/arham-fintech-bse-trades
# Video: https://www.loom.com/share/6bd24bbfe99c4f31a1abf5853203c27c
```
