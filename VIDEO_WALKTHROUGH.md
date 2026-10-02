# Video Walkthrough Script & Recording Guide

Use this script to record a 2 to 3-minute video walkthrough (e.g. using Loom, OBS, or QuickTime) for your submission to **chirag.g@arhamfintech.ai** and **hr@arhamfintech.ai**.

---

## 🎬 Section 1: Introduction (30 seconds)
- **What to show:** Screen on `http://localhost:3000` with the dashboard open and terminal in the background.
- **What to say:**
  > *"Hello Chirag and the Arham Fintech team. This is my submission for the Software Engineer technical assessment.*
  > *In this demo, I will walk you through the Mock BSE Exchange API, our resilient ingestion engine, and the real-time trades dashboard.*
  > *Our core challenge was pulling exchange data where a full pull takes up to 15 minutes, but our network terminates any HTTP connection held open longer than 30 seconds."*

---

## 🎬 Section 2: Instant Load & Mock BSE API (45 seconds)
- **What to show:**
  - Refresh `http://localhost:3000` — highlight how existing trades appear **instantly (< 15ms)** from our local SQLite cache without any blank screen or spinner lag.
  - Show the terminal or `http://localhost:4000/status` to show the Mock BSE API running with 5,000 seeded realistic trades and a default 15-minute delay.
- **What to say:**
  > *"First, notice that the dashboard opens instantly. By maintaining a local indexed SQLite persistence layer, previously pulled trades render immediately in under 15 milliseconds.*
  > *Our Mock BSE API provides `GET /getTrades` with 5,000 seeded trades and a default 15-minute delay as specified in the scenario.*
  > *To overcome the 30-second network kill limit, our ingestion worker uses a chunked windowing architecture where each batch finishes in about 1 second, well below the 30-second threshold."*

---

## 🎬 Section 3: Triggering a Pull & Live Dashboard Operation (45 seconds)
- **What to show:**
  - Click **"10s (Fast Demo)"** (or 30s) and click **"Trigger BSE Pull"**.
  - Point out the **Live Progress Banner**:
    - Show `Batch X of 10`.
    - Point to **"Last Request Duration: ~0.5s (< 30s limit)"**.
    - Show that while the pull is actively running, you can still scroll, search (e.g. type `RELIANCE` or `TCS`), and use filters on the existing trades!
- **What to say:**
  > *"Let's trigger a pull. Notice that the ingestion engine starts pulling batches in the background. Each HTTP call takes less than 1 second, completely avoiding the 30-second timeout.*
  > *Even while the pull is in progress, the dashboard remains completely responsive. Users can search by symbol, filter by BUY/SELL, or browse through trades without interruption."*

---

## 🎬 Section 4: Real-Time Auto-Update (30 seconds)
- **What to show:**
  - Keep the screen steady as the pull completes.
  - Show the **Toast notification**: *"🎉 Pull Completed! 5,000 trades synchronized..."*.
  - Show the new trades appearing in the table with an **emerald glow animation**.
  - Open DevTools Network tab: show that **no polling loop** exists! The update was pushed over the single persistent WebSocket (`/ws`).
- **What to say:**
  > *"And now the pull has completed! Notice that the new trades appeared on the open dashboard automatically with an emerald highlight.*
  > *Crucially, this happened with NO page refresh, NO polling loop, and NO cron scheduler. The backend ingestion engine broadcasted the completion event over WebSockets directly to the UI.*
  > *Thank you, and I look forward to discussing this in detail at the Malad office!"*
