import React from 'react';
import { Database, TrendingUp, BarChart3, Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { IngestionStatus } from '../hooks/useTradesWebSocket';

interface MetricsHeaderProps {
  summary: {
    totalTrades: number;
    totalVolume: number;
    grossValue: number;
    avgPrice: number;
  };
  pullStatus: IngestionStatus;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({ summary, pullStatus }) => {
  // Format gross value in Indian Crores or Lakhs
  const formatINR = (val: number) => {
    if (!val) return '₹0.00';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const isPulling = pullStatus.status === 'IN_PROGRESS';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Ingested Trades */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ingested Trades</p>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold mono text-white">
            {(summary.totalTrades || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-400">records</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
          <span className="text-emerald-400 font-medium">Instant Load</span>
          <span>from local SQLite cache</span>
        </p>
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Gross Notional Value */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gross Notional Value</p>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold mono text-emerald-400">
            {formatINR(summary.grossValue)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Avg Price: <span className="mono text-slate-200">₹{(summary.avgPrice || 0).toFixed(2)}</span>
        </p>
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Total Traded Volume */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Traded Share Volume</p>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold mono text-white">
            {(summary.totalVolume || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-400">units</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          BSE Equity instruments executed
        </p>
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Ingestion Engine Status */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pull Engine Status</p>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          {isPulling ? (
            <>
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              <span className="text-base font-bold text-amber-400">Pulling in Progress</span>
            </>
          ) : pullStatus.status === 'COMPLETED' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-base font-bold text-emerald-400">Synced / Completed</span>
            </>
          ) : pullStatus.status === 'FAILED' ? (
            <>
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span className="text-base font-bold text-rose-400">Failed</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-base font-bold text-slate-300">Ready (Idle)</span>
            </>
          )}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          {isPulling ? (
            <span>Batch {pullStatus.currentBatch}/{pullStatus.totalBatches} (ETA: {pullStatus.etaSeconds}s)</span>
          ) : (
            <span>No active background pull</span>
          )}
        </div>
      </div>
    </div>
  );
};
