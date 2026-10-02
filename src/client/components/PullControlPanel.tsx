import React, { useState } from 'react';
import { Play, Square, RotateCcw, AlertTriangle, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { IngestionStatus } from '../hooks/useTradesWebSocket';

interface PullControlPanelProps {
  pullStatus: IngestionStatus;
  onTriggerPull: (delaySeconds: number) => Promise<any>;
  onCancelPull: () => Promise<any>;
  onResetData: () => Promise<any>;
}

export const PullControlPanel: React.FC<PullControlPanelProps> = ({
  pullStatus,
  onTriggerPull,
  onCancelPull,
  onResetData
}) => {
  // Default to 10s for fast live demo, but user can pick 900s (15 min) or custom
  const [selectedDelay, setSelectedDelay] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPulling = pullStatus.status === 'IN_PROGRESS';
  const progressPercent = pullStatus.totalBatches > 0 
    ? Math.min(100, Math.round((pullStatus.currentBatch / pullStatus.totalBatches) * 100))
    : 0;

  const handleStart = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onTriggerPull(selectedDelay);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start pull');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset local trades database to baseline seed?')) {
      await onResetData();
    }
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Configuration & Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Simulated BSE Pull Delay
            </label>
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDelay(10)}
                disabled={isPulling}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedDelay === 10
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                } ${isPulling ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                10s (Fast Demo)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDelay(30)}
                disabled={isPulling}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedDelay === 30
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                } ${isPulling ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                30s (Medium)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDelay(900)}
                disabled={isPulling}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedDelay === 900
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                } ${isPulling ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                15 Mins (Exchange Spec)
              </button>
            </div>
          </div>

          {/* Trigger Button */}
          <div className="sm:self-end">
            {!isPulling ? (
              <button
                onClick={handleStart}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isSubmitting ? 'Starting...' : 'Trigger BSE Pull'}</span>
              </button>
            ) : (
              <button
                onClick={onCancelPull}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-sm transition"
              >
                <Square className="w-4 h-4 fill-rose-300" />
                <span>Cancel Pull</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Technical constraint highlight & Reset button */}
        <div className="flex items-center space-x-3 self-end lg:self-center">
          <div className="text-right hidden md:block">
            <p className="text-xs font-medium text-slate-300">Resilient Chunked Ingestion</p>
            <p className="text-[11px] text-slate-400">Keeps every HTTP connection &lt; 30s</p>
          </div>
          <button
            onClick={handleReset}
            disabled={isPulling}
            title="Reset database to baseline"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Pull Status Progress Banner */}
      {isPulling && (
        <div className="mt-5 pt-5 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-sm font-bold text-white">
                BSE Pull In Progress
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/40 mono">
                Batch {pullStatus.currentBatch} of {pullStatus.totalBatches || 10}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <span>
                Last Request Duration:{' '}
                <strong className="text-emerald-400 mono">
                  {(pullStatus.lastBatchDurationMs / 1000).toFixed(2)}s
                </strong>{' '}
                <span className="text-[10px] text-slate-400">(&lt; 30s limit)</span>
              </span>
              <span>
                Elapsed: <strong className="text-slate-200 mono">{pullStatus.elapsedSeconds}s</strong>
              </span>
              <span>
                ETA: <strong className="text-amber-400 mono">{pullStatus.etaSeconds}s</strong>
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>
              Ingested this pull: <strong className="text-white mono">{pullStatus.tradesPulledInRun}</strong> trades
            </span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dashboard is open and fully operational during pull</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
