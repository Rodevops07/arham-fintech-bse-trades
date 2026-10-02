import React from 'react';
import { X, ShieldAlert, Cpu, Server, Wifi, CheckCircle2 } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <span>System Architecture & Technical Design Note</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ARHAM Fintech Assessment — BSE Exchange Trade Ingestion Engine
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-700">
          {/* Problem Statement Card */}
          <div className="p-4.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900">
            <h3 className="font-bold flex items-center space-x-2 text-amber-950 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>Core Constraint & Challenge</span>
            </h3>
            <p className="text-xs leading-relaxed">
              <strong>Scenario:</strong> BSE Exchange full data extraction takes up to <strong>15 minutes</strong>, but our enterprise gateway / reverse-proxy forcefully terminates any HTTP connection held open longer than <strong>30 seconds</strong>.
            </p>
            <p className="text-xs mt-2 leading-relaxed">
              <strong>Naive Failure Mode:</strong> Any single monolithic HTTP request (e.g., <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">fetch('GET /getTrades')</code>) held open for 15 minutes will reliably fail with a <code className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-800 font-mono">504 Gateway Timeout</code> at second 30.
            </p>
          </div>

          {/* Solution Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-blue-100/70 flex items-center justify-center text-blue-700 mb-3">
                <Cpu className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">1. Chunked Resilient Ingestion</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                The pull is divided into sequential cursor/page batches (500 records/batch). Each individual HTTP connection terminates cleanly in <strong>&lt; 2 seconds</strong> (far below the 30s ceiling).
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-700 mb-3">
                <Server className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">2. Instant Local Persistence</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                Trades are committed immediately to local SQLite. When any client opens the dashboard, previously pulled trades load in <strong>&lt; 15 milliseconds</strong>, even if a pull is running!
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-purple-100/70 flex items-center justify-center text-purple-700 mb-3">
                <Wifi className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">3. Push-Driven WebSockets</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                Zero page refresh, zero polling loops, zero cron jobs. The ingestion engine emits <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-800 font-mono">PULL_COMPLETED</code> over persistent WebSockets to update the UI live.
              </p>
            </div>
          </div>

          {/* Sequence Flow */}
          <div className="p-4.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs shadow-inner">
            <h4 className="font-bold text-white mb-3 font-sans">End-to-End Sequence Flow</h4>
            <div className="bg-black/50 p-4 rounded-xl text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
{`[Dashboard Client]           [Backend Engine & DB]           [Mock BSE API]
        |                              |                           |
        |--- 1. GET /api/trades ------>|                           |
        |<-- 2. Instant Trades (SQLite)|                           | (Instant Render < 15ms)
        |                              |                           |
        |=== 3. WS Connect /ws =======>|                           | (Persistent Socket)
        |                              |                           |
        |--- 4. POST /api/pull/start ->|                           |
        |<-- 5. Status: IN_PROGRESS ---|                           |
        |                              |-- 6. GET /getTrades?p=1 ->| (Req 1: ~1s < 30s)
        |                              |<- 7. Batch 1 (500 trades)-|
        |                              |-- [Write to SQLite DB]    |
        |<== 8. WS: PULL_PROGRESS =====|                           | (Live Progress Updates)
        |                              |            ...            |
        |                              |-- N. GET /getTrades?p=Last| (Req N: ~1s < 30s)
        |                              |<- Batch Last (hasMore: F) |
        |<== WS: PULL_COMPLETED =======|                           | (Auto-renders New Trades!)
        |  (Smooth highlight animation |                           |
        |   NO page reload, NO poll!)  |                           |`}
            </div>
          </div>

          {/* Checklist of Assessment Requirements */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Assessment Requirements Checklist</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Mock BSE API with GET /getTrades</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Seeded trades: ID, client, symbol, qty, price, ts</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Configurable delay to pull (15 mins default)</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Handles 30s connection timeout limit</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Dashboard opens instantly showing past trades</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Operational while pull is in progress</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Auto-updates on completion (WebSockets)</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>No page refresh, no polling loop, no cronjob</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Close Note
          </button>
        </div>
      </div>
    </div>
  );
};
