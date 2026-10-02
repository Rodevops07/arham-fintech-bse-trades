import { broadcast } from './websocketServer';
import { insertTradesBatch, getTradesCount, db } from './db';

const BSE_API_BASE = process.env.BSE_API_URL || 'http://localhost:4000';

export interface IngestionStatus {
  status: 'IDLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  runId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  currentBatch: number;
  totalBatches: number;
  tradesPulledInRun: number;
  totalTradesInDb: number;
  lastBatchDurationMs: number;
  targetDelaySeconds: number;
  elapsedSeconds: number;
  etaSeconds: number;
  error?: string | null;
}

let currentStatus: IngestionStatus = {
  status: 'IDLE',
  runId: null,
  startedAt: null,
  completedAt: null,
  currentBatch: 0,
  totalBatches: 0,
  tradesPulledInRun: 0,
  totalTradesInDb: 0,
  lastBatchDurationMs: 0,
  targetDelaySeconds: 900,
  elapsedSeconds: 0,
  etaSeconds: 0,
  error: null
};

let activeAbortController: AbortController | null = null;

export function getIngestionStatus(): IngestionStatus {
  currentStatus.totalTradesInDb = getTradesCount();
  if (currentStatus.status === 'IN_PROGRESS' && currentStatus.startedAt) {
    const elapsed = (Date.now() - new Date(currentStatus.startedAt).getTime()) / 1000;
    currentStatus.elapsedSeconds = Math.round(elapsed);
    if (currentStatus.totalBatches > 0 && currentStatus.currentBatch > 0) {
      const remainingBatches = currentStatus.totalBatches - currentStatus.currentBatch;
      const avgBatchTime = elapsed / currentStatus.currentBatch;
      currentStatus.etaSeconds = Math.max(0, Math.round(remainingBatches * avgBatchTime));
    }
  }
  return { ...currentStatus };
}

/**
 * Triggers a BSE Trade Pull.
 * Overcomes the 30-second network kill limit by chunking/paginating
 * the pull across multiple requests, keeping every HTTP connection well below 30s.
 */
export async function startBsePull(options: { delaySeconds?: number; pageSize?: number } = {}) {
  if (currentStatus.status === 'IN_PROGRESS') {
    throw new Error('An ingestion pull is already in progress.');
  }

  const delaySeconds = options.delaySeconds !== undefined ? options.delaySeconds : 900;
  const pageSize = options.pageSize || 500;
  const runId = `RUN-${Date.now()}`;

  activeAbortController = new AbortController();

  currentStatus = {
    status: 'IN_PROGRESS',
    runId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    currentBatch: 0,
    totalBatches: 10, // will be updated on first response
    tradesPulledInRun: 0,
    totalTradesInDb: getTradesCount(),
    lastBatchDurationMs: 0,
    targetDelaySeconds: delaySeconds,
    elapsedSeconds: 0,
    etaSeconds: delaySeconds,
    error: null
  };

  broadcast('PULL_STARTED', getIngestionStatus());

  // Record run in database
  db.prepare(`
    INSERT INTO ingestion_runs (id, status, total_batches, completed_batches, total_trades, started_at, config_delay_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(runId, 'IN_PROGRESS', 0, 0, 0, currentStatus.startedAt, delaySeconds);

  // Background execution without blocking caller
  (async () => {
    const startTime = Date.now();
    let page = 1;
    let hasMore = true;
    let totalPulled = 0;

    try {
      while (hasMore) {
        if (activeAbortController?.signal.aborted) {
          throw new Error('Pull cancelled by user.');
        }

        const batchStart = Date.now();
        console.log(`[Ingestion Worker] Requesting Batch #${page} from BSE API (delay target: ${delaySeconds}s)...`);

        // HTTP timeout set to 28s to strictly prevent exceeding the 30s network kill limit
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000);

        const url = `${BSE_API_BASE}/getTrades?page=${page}&limit=${pageSize}&delay=${delaySeconds}`;
        const response = await fetch(url, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`BSE API returned HTTP ${response.status}: ${response.statusText}`);
        }

        const json: any = await response.json();
        const batchDuration = Date.now() - batchStart;

        const trades = json.trades || [];
        const meta = json.meta || {};

        // Persist batch into database immediately
        if (trades.length > 0) {
          insertTradesBatch(trades);
          totalPulled += trades.length;
        }

        currentStatus.currentBatch = page;
        currentStatus.totalBatches = meta.totalPages || page;
        currentStatus.tradesPulledInRun = totalPulled;
        currentStatus.totalTradesInDb = getTradesCount();
        currentStatus.lastBatchDurationMs = batchDuration;
        
        const elapsed = (Date.now() - startTime) / 1000;
        currentStatus.elapsedSeconds = Math.round(elapsed);
        const remainingBatches = currentStatus.totalBatches - currentStatus.currentBatch;
        const avgBatchSec = elapsed / currentStatus.currentBatch;
        currentStatus.etaSeconds = Math.max(0, Math.round(remainingBatches * avgBatchSec));

        console.log(`[Ingestion Worker] Batch #${page}/${currentStatus.totalBatches} completed in ${(batchDuration / 1000).toFixed(2)}s (< 30s limit). Ingested: ${trades.length} trades.`);

        // Broadcast batch progress to all open dashboards
        broadcast('PULL_PROGRESS', {
          ...getIngestionStatus(),
          batchReceived: trades.length
        });

        hasMore = Boolean(meta.hasMore && page < meta.totalPages);
        page++;
      }

      // Finalize completed pull
      const totalDuration = (Date.now() - startTime) / 1000;
      currentStatus.status = 'COMPLETED';
      currentStatus.completedAt = new Date().toISOString();
      currentStatus.etaSeconds = 0;
      currentStatus.elapsedSeconds = Math.round(totalDuration);

      db.prepare(`
        UPDATE ingestion_runs 
        SET status = ?, completed_batches = ?, total_trades = ?, completed_at = ?, duration_seconds = ?
        WHERE id = ?
      `).run('COMPLETED', currentStatus.currentBatch, totalPulled, currentStatus.completedAt, totalDuration, runId);

      console.log(`🎉 [Ingestion Worker] Pull completed! Ingested ${totalPulled} trades across ${currentStatus.currentBatch} batches in ${totalDuration.toFixed(2)}s.`);

      // Broadcast completion to all open dashboards with new trades summary
      broadcast('PULL_COMPLETED', {
        ...getIngestionStatus(),
        totalNewTrades: totalPulled,
        durationSeconds: totalDuration
      });

    } catch (err: any) {
      console.error(`❌ [Ingestion Worker] Pull error:`, err.message);
      currentStatus.status = 'FAILED';
      currentStatus.error = err.message;

      db.prepare(`
        UPDATE ingestion_runs 
        SET status = ?, completed_at = ?
        WHERE id = ?
      `).run('FAILED', new Date().toISOString(), runId);

      broadcast('PULL_FAILED', {
        ...getIngestionStatus(),
        errorMessage: err.message
      });
    } finally {
      activeAbortController = null;
    }
  })();

  return getIngestionStatus();
}

export function cancelBsePull() {
  if (activeAbortController) {
    activeAbortController.abort();
    currentStatus.status = 'IDLE';
    currentStatus.error = 'Cancelled by operator';
    broadcast('PULL_CANCELLED', getIngestionStatus());
    return true;
  }
  return false;
}
