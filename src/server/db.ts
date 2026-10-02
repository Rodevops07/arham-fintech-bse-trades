import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'trades.db');
export const db = new DatabaseSync(DB_PATH);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS trades (
    trade_id TEXT PRIMARY KEY,
    client TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    timestamp TEXT NOT NULL,
    side TEXT NOT NULL,
    total_value REAL NOT NULL,
    pulled_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
  CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
  CREATE INDEX IF NOT EXISTS idx_trades_client ON trades(client);

  CREATE TABLE IF NOT EXISTS ingestion_runs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    total_batches INTEGER NOT NULL,
    completed_batches INTEGER NOT NULL,
    total_trades INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_seconds REAL,
    config_delay_seconds REAL
  );
`);

export interface DbTrade {
  trade_id: string;
  client: string;
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
  side: string;
  total_value: number;
  pulled_at: string;
}

export function insertTradesBatch(trades: any[]): number {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO trades (
      trade_id, client, symbol, quantity, price, timestamp, side, total_value, pulled_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  let count = 0;

  db.exec('BEGIN TRANSACTION');
  try {
    for (const t of trades) {
      insertStmt.run(
        t.tradeId || t.trade_id,
        t.client,
        t.symbol,
        t.quantity,
        t.price,
        t.timestamp,
        t.side || 'BUY',
        t.totalValue || t.total_value || (t.quantity * t.price),
        now
      );
      count++;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return count;
}

export function getTradesCount(): number {
  const result: any = db.prepare('SELECT COUNT(*) as count FROM trades').get();
  return result ? result.count : 0;
}

export function getTrades(options: {
  limit?: number;
  offset?: number;
  symbol?: string;
  client?: string;
  side?: string;
  search?: string;
} = {}): { trades: DbTrade[]; total: number; summary: any } {
  const limit = options.limit || 100;
  const offset = options.offset || 0;

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (options.symbol) {
    whereClauses.push('symbol = ?');
    params.push(options.symbol);
  }

  if (options.client) {
    whereClauses.push('client = ?');
    params.push(options.client);
  }

  if (options.side) {
    whereClauses.push('side = ?');
    params.push(options.side);
  }

  if (options.search) {
    whereClauses.push('(trade_id LIKE ? OR symbol LIKE ? OR client LIKE ?)');
    const searchParam = `%${options.search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalStmt = db.prepare(`SELECT COUNT(*) as total FROM trades ${whereSql}`);
  const totalRes: any = totalStmt.get(...params);
  const total = totalRes ? totalRes.total : 0;

  const dataStmt = db.prepare(`
    SELECT * FROM trades 
    ${whereSql}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `);
  const trades: any = dataStmt.all(...params, limit, offset);

  // Overall KPI aggregates
  const summaryStmt = db.prepare(`
    SELECT 
      COUNT(*) as totalTrades,
      SUM(quantity) as totalVolume,
      SUM(total_value) as grossValue,
      AVG(price) as avgPrice
    FROM trades
  `);
  const summary: any = summaryStmt.get() || { totalTrades: 0, totalVolume: 0, grossValue: 0, avgPrice: 0 };

  return { trades, total, summary };
}

export function seedInitialHistoricalTrades() {
  const count = getTradesCount();
  if (count === 0) {
    console.log('[Database] Seeding 300 initial historical trades to ensure instant open...');
    // Seed an initial sample so the dashboard opens immediately with existing trades
    const sampleTrades = [];
    const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'SBIN'];
    const clients = ['CL-ARHAM-INST-01', 'CL-ZERODHA-8821', 'CL-GROWW-4412', 'CL-HDFC-SEC-9901'];
    
    const base = new Date('2026-10-02T08:00:00Z').getTime();
    for (let i = 1; i <= 300; i++) {
      const sym = symbols[i % symbols.length];
      const cl = clients[i % clients.length];
      const qty = (i % 20 + 1) * 25;
      const prc = 1500 + (i % 50) * 12.5;
      sampleTrades.push({
        tradeId: `HIST-TRD-${String(i).padStart(5, '0')}`,
        client: cl,
        symbol: sym,
        quantity: qty,
        price: prc,
        timestamp: new Date(base + i * 15000).toISOString(),
        side: i % 2 === 0 ? 'BUY' : 'SELL',
        totalValue: qty * prc
      });
    }
    insertTradesBatch(sampleTrades);
    console.log('[Database] Seeded 300 initial historical trades successfully.');
  }
}
