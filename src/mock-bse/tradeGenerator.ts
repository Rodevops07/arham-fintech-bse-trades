export interface Trade {
  tradeId: string;
  client: string;
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
  side: 'BUY' | 'SELL';
  totalValue: number;
}

const SYMBOLS = [
  { symbol: 'RELIANCE', basePrice: 2950.0 },
  { symbol: 'TCS', basePrice: 3820.0 },
  { symbol: 'HDFCBANK', basePrice: 1650.0 },
  { symbol: 'INFY', basePrice: 1780.0 },
  { symbol: 'ICICIBANK', basePrice: 1120.0 },
  { symbol: 'TATAMOTORS', basePrice: 940.0 },
  { symbol: 'SBIN', basePrice: 785.0 },
  { symbol: 'ITC', basePrice: 460.0 },
  { symbol: 'BHARTIARTL', basePrice: 1420.0 },
  { symbol: 'LT', basePrice: 3600.0 },
  { symbol: 'BAJFINANCE', basePrice: 6900.0 },
  { symbol: 'MARUTI', basePrice: 12400.0 },
  { symbol: 'ASIANPAINT', basePrice: 2850.0 },
  { symbol: 'SUNPHARMA', basePrice: 1620.0 },
  { symbol: 'AXISBANK', basePrice: 1190.0 }
];

const CLIENTS = [
  'CL-ARHAM-INST-01',
  'CL-ARHAM-ALPHA-02',
  'CL-ZERODHA-8821',
  'CL-GROWW-4412',
  'CL-HDFC-SEC-9901',
  'CL-KOTAK-SEC-1204',
  'CL-ICICI-DIR-5510',
  'CL-MOTILAL-3390',
  'CL-ANGEL-ONE-7721',
  'CL-SBI-CAP-6029'
];

export function generateSeededTrades(count = 5000): Trade[] {
  const trades: Trade[] = [];
  const baseTime = new Date('2026-10-02T09:15:00Z').getTime(); // Market open 09:15 IST
  
  // Seeded deterministic PRNG for reproducible test data
  let seed = 42;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let i = 1; i <= count; i++) {
    const symObj = SYMBOLS[Math.floor(random() * SYMBOLS.length)];
    const client = CLIENTS[Math.floor(random() * CLIENTS.length)];
    const side: 'BUY' | 'SELL' = random() > 0.5 ? 'BUY' : 'SELL';
    
    // Quantity between 10 and 2500
    const quantity = Math.floor(random() * 250) * 10 + 10;
    
    // Price with small fluctuation +/- 1.5%
    const priceVariance = (random() - 0.5) * 0.03 * symObj.basePrice;
    const price = Math.round((symObj.basePrice + priceVariance) * 100) / 100;
    const totalValue = Math.round(quantity * price * 100) / 100;
    
    // Timestamp spaced throughout trading day
    const tradeTime = new Date(baseTime + Math.floor(random() * 6 * 3600 * 1000));
    
    trades.push({
      tradeId: `BSE-TRD-${String(i).padStart(6, '0')}`,
      client,
      symbol: symObj.symbol,
      quantity,
      price,
      timestamp: tradeTime.toISOString(),
      side,
      totalValue
    });
  }

  // Sort by timestamp
  return trades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
