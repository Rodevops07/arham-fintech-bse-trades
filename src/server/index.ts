import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { db, getTrades, seedInitialHistoricalTrades, DbTrade } from './db';
import { initWebSocketServer } from './websocketServer';
import { startBsePull, getIngestionStatus, cancelBsePull } from './ingestionWorker';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// Ensure initial historical data exists so dashboard opens instantly
seedInitialHistoricalTrades();

/**
 * GET /api/trades
 * Instant retrieval of ingested trades with filtering & pagination
 */
app.get('/api/trades', (req, res) => {
  const limit = Math.min(1000, parseInt(req.query.limit as string, 10) || 50);
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const offset = (page - 1) * limit;

  const symbol = req.query.symbol as string;
  const client = req.query.client as string;
  const side = req.query.side as string;
  const search = req.query.search as string;

  const result = getTrades({
    limit,
    offset,
    symbol,
    client,
    side,
    search
  });

  res.json({
    status: 'success',
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
    summary: result.summary,
    trades: result.trades
  });
});

/**
 * GET /api/pull-status
 * Live ingestion state & progress
 */
app.get('/api/pull-status', (req, res) => {
  res.json(getIngestionStatus());
});

/**
 * POST /api/pull/start
 * Trigger BSE Trade pull
 */
app.post('/api/pull/start', async (req, res) => {
  try {
    const delaySeconds = req.body.delaySeconds !== undefined 
      ? Number(req.body.delaySeconds) 
      : 900;
    
    const status = await startBsePull({ delaySeconds });
    res.json({
      status: 'success',
      message: 'BSE Pull initiated successfully',
      pull: status
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/pull/cancel
 */
app.post('/api/pull/cancel', (req, res) => {
  const success = cancelBsePull();
  res.json({ success, message: success ? 'Pull cancelled' : 'No active pull' });
});

/**
 * POST /api/trades/reset
 * Resets database and re-seeds baseline data for clean demos
 */
app.post('/api/trades/reset', (req, res) => {
  db.exec('DELETE FROM trades');
  db.exec('DELETE FROM ingestion_runs');
  seedInitialHistoricalTrades();
  res.json({ status: 'success', message: 'Trades reset to baseline' });
});

server.listen(PORT, () => {
  console.log(`🚀 [Trades Dashboard Backend] Server listening at http://localhost:${PORT}`);
  console.log(`🔌 [WebSocket] Server endpoint ready at ws://localhost:${PORT}/ws`);
});
