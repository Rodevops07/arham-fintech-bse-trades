import React from 'react';
import { X, ShieldAlert, Cpu, Server, Wifi, CheckCircle2 } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0f172a] z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>System Architecture & Technical Design Note</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ARHAM Fintech Assessment — BSE Exchange Trade Ingestion Engine
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-300">
          {/* Problem Statement Card */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200">
            <h3 className="font-bold flex items-center space-x-2 text-amber-300 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Core Constraint & Challenge</span>
            </h3>
            <p className="text-xs leading-relaxed">
              <strong>Scenario:</strong> BSE Exchange full data extraction takes up to <strong>15 minutes</strong>, but our enterprise gateway / reverse-proxy forcefully terminates any HTTP connection held open longer than <strong>30 seconds</strong>.
            </p>
            <p className="text-xs mt-2 leading-relaxed">
              <strong>Naive Failure Mode:</strong> Any single monolithic HTTP request (e.g., <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">fetch('GET /getTrades')</code>) held open for 15 minutes will reliably fail with a <code className="bg-black/40 px-1 py-0.5 rounded text-rose-300">504 Gateway Timeout</code> or <code className="bg-black/40 px-1 py-0.5 rounded text-rose-300">ECONNRESET</code> at the 30-second mark.
            </p>
          </div>

          {/* Solution Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">1. Chunked Resilient Ingestion</h4>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                The pull is divided into sequential cursor/page batches (e.g. 500 records/batch). Each individual HTTP connection terminates cleanly in <strong>&lt; 2 seconds</strong> (far below the 30s ceiling), while the total pull across all batches completes the 15-minute simulated volume.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">2. Instant Local Persistence</h4>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Trades are committed immediately to a local high-performance SQLite database. When any client opens the dashboard, previously pulled trades load in <strong>&lt; 15 milliseconds</strong>, even if a new background pull is currently running!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
                <Wifi className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-xs mb-1">3. Push-Driven WebSockets</h4>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Zero page refresh, zero HTTP polling loops, zero cron jobs. The ingestion engine emits <code className="bg-black/40 px-1 py-0.5 rounded text-purple-300">PULL_COMPLETED</code> over persistent WebSockets. The dashboard reacts instantly and updates the UI state live.
              </p>
            </div>
          </div>

          {/* Sequence Flow */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <h4 className="font-bold text-white mb-3 font-sans">End-to-End Sequence Flow</h4>
            <div className="bg-black/60 p-4 rounded-lg text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
{`[Dashboard Client]           [Backend Engine & DB]           [Mock BSE API]
        |                              |                           |
        |--- 1. GET /api/trades ------>|                           |
        |<-- 2. Instant Trades (SQLite)|                           | (Instant Render < 15ms)
        |                              |                           |
        |=== 3. WS Connect /ws =======>|                           | (Persistent Socket)
        |                              |                           |
        |--- 4. POST /api/pull/start ->|                           |
        |<-- 5. Status: IN_PROGRESS ---|                           |
        |                              |-- 6. GET /getTrades?p=1 ->| (Req 1: 1.2s < 30s)
        |                              |<- 7. Batch 1 (500 trades)-|
        |                              |-- [Write to SQLite DB]    |
        |<== 8. WS: PULL_PROGRESS =====|                           | (Live Progress Updates)
        |                              |-- 9. GET /getTrades?p=2 ->| (Req 2: 1.1s < 30s)
        |                              |<- 10. Batch 2 (500 trades)|
        |                              |-- [Write to SQLite DB]    |
        |                              |            ...            |
        |                              |-- N. GET /getTrades?p=Last| (Req N: 1.2s < 30s)
        |                              |<- Batch Last (hasMore: F) |
        |<== WS: PULL_COMPLETED =======|                           | (Auto-renders New Trades!)
        |  (Smooth highlight animation |                           |
        |   NO page reload, NO poll!)  |                           |`}
            </div>
          </div>

          {/* Checklist of Assessment Requirements */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Assessment Requirements Checklist</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Mock BSE API with GET /getTrades</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Seeded trades: ID, client, symbol, qty, price, ts</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Configurable delay to pull (15 mins default)</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Handles 30s connection timeout limit</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Dashboard opens instantly showing past trades</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Operational while pull is in progress</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Auto-updates on completion (WebSockets)</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>No page refresh, no polling loop, no cronjob</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0c1322] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
          >
            Close Note
          </button>
        </div>
      </div>
    </div>
  );
};
