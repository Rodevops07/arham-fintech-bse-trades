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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Ingested Trades</p>
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Database className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold mono text-slate-900">
            {(summary.totalTrades || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-medium text-slate-500">records</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1.5 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-700 font-semibold">Instant Load</span>
          <span>from local SQLite cache</span>
        </p>
      </div>

      {/* Gross Notional Value */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Notional Value</p>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold mono text-emerald-600">
            {formatINR(summary.grossValue)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          Avg Price: <span className="mono font-semibold text-slate-700">₹{(summary.avgPrice || 0).toFixed(2)}</span>
        </p>
      </div>

      {/* Total Traded Volume */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Traded Share Volume</p>
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <BarChart3 className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold mono text-slate-900">
            {(summary.totalVolume || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-medium text-slate-500">units</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          BSE Equity instruments executed
        </p>
      </div>

      {/* Ingestion Engine Status */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pull Engine Status</p>
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center space-x-2">
          {isPulling ? (
            <>
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              <span className="text-base font-bold text-amber-700">Pulling in Progress</span>
            </>
          ) : pullStatus.status === 'COMPLETED' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-base font-bold text-emerald-700">Synced / Completed</span>
            </>
          ) : pullStatus.status === 'FAILED' ? (
            <>
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span className="text-base font-bold text-rose-700">Failed</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-base font-bold text-slate-700">Ready (Idle)</span>
            </>
          )}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 font-medium">
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
