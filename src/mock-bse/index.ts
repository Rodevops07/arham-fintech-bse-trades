import express from 'express';
import cors from 'cors';
import { generateSeededTrades, Trade } from './tradeGenerator';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.BSE_PORT || 4000;

// Default delay: 15 minutes (900 seconds) as stated in technical specification
// Can be overridden via env var or query parameter ?delay=...
let configuredTotalDelaySeconds = Number(process.env.BSE_PULL_DELAY_SECONDS) || 900;

// Seed 5,000 realistic BSE trades
const ALL_TRADES: Trade[] = generateSeededTrades(5000);

console.log(`[Mock BSE Exchange API] Seeded ${ALL_TRADES.length} trades.`);
console.log(`[Mock BSE Exchange API] Default full pull delay configured to: ${configuredTotalDelaySeconds}s (${(configuredTotalDelaySeconds / 60).toFixed(1)} mins).`);

/**
 * GET /getTrades
 * 
 * Query parameters:
 * - page: 1-indexed page number (default: 1)
 * - limit: items per page (default: 500)
 * - delay: optional override for total pull duration in seconds
 * - monolithic: if "true", attempts to return all records at once with full delay (which demonstrates the 30s timeout failure!)
 */
app.get('/getTrades', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 500);
  const requestedDelay = req.query.delay !== undefined 
    ? Math.max(0, parseFloat(req.query.delay as string))
    : configuredTotalDelaySeconds;
  const isMonolithic = req.query.monolithic === 'true';

  const totalRecords = ALL_TRADES.length;
  const totalPages = Math.ceil(totalRecords / limit);

  // If client tries naive monolithic pull with long delay (> 30s)
  if (isMonolithic) {
    console.log(`[Mock BSE API] Monolithic request received. Requested delay: ${requestedDelay}s.`);
    if (requestedDelay > 30) {
      console.warn(`[Mock BSE API] WARNING: Holding open monolithic connection for ${requestedDelay}s. Network policy kills connections > 30s!`);
      // Simulate network proxy terminating connection after 30 seconds
      setTimeout(() => {
        if (!res.writableEnded) {
          console.error(`[Mock BSE API] Connection terminated by 30s Network Gateway Timeout!`);
          res.status(504).json({
            error: 'Gateway Timeout: Connection held open longer than 30 seconds by network policy',
            durationSeconds: 30
          });
        }
      }, 30000);
      return;
    }

    // Monolithic with short delay (e.g. testing)
    await new Promise((resolve) => setTimeout(resolve, requestedDelay * 1000));
    return res.json({
      status: 'success',
      meta: {
        totalTrades: totalRecords,
        isMonolithic: true,
        durationSeconds: requestedDelay
      },
      trades: ALL_TRADES
    });
  }

  // --- Resilient Chunked / Paginated Fetching Architecture ---
  // To pull data that takes up to 15 minutes without hitting the 30-second network kill limit,
  // the pull is split into batches where each batch takes (totalDelay / totalPages) seconds.
  // Example: 15 min (900s) across 30 batches = 30s per batch, or across 50 batches = 18s per batch.
  const delayPerBatchSeconds = totalPages > 0 ? requestedDelay / totalPages : 0;
  const delayMs = Math.round(delayPerBatchSeconds * 1000);

  console.log(`[Mock BSE API] Serving batch ${page}/${totalPages} (${limit} items). Batch delay: ${delayPerBatchSeconds.toFixed(2)}s (Total pull target: ${requestedDelay}s)`);

  // Simulate realistic network/processing delay for this batch
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalRecords);
  const pageTrades = startIndex < totalRecords ? ALL_TRADES.slice(startIndex, endIndex) : [];

  const hasMore = endIndex < totalRecords;

  return res.json({
    status: 'success',
    meta: {
      totalTrades: totalRecords,
      page,
      totalPages,
      limit,
      returnedCount: pageTrades.length,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      batchDelaySeconds: delayPerBatchSeconds,
      configuredTotalDelaySeconds: requestedDelay
    },
    trades: pageTrades
  });
});

/**
 * POST /config
 * Allows updating the default pull delay without restarting server
 */
app.post('/config', (req, res) => {
  const { delaySeconds } = req.body;
  if (typeof delaySeconds === 'number' && delaySeconds >= 0) {
    configuredTotalDelaySeconds = delaySeconds;
    console.log(`[Mock BSE API] Configured delay updated to ${configuredTotalDelaySeconds}s`);
    return res.json({ status: 'ok', configuredTotalDelaySeconds });
  }
  return res.status(400).json({ error: 'delaySeconds must be a non-negative number' });
});

/**
 * GET /status
 */
app.get('/status', (req, res) => {
  res.json({
    service: 'Mock BSE Exchange API',
    status: 'ONLINE',
    seededTrades: ALL_TRADES.length,
    configuredTotalDelaySeconds,
    timeoutConstraintNote: 'Network terminates connections > 30s; chunked ingestion recommended'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [Mock BSE API] Running at http://localhost:${PORT}`);
});
