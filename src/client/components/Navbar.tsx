import React from 'react';
import { Activity, ShieldCheck, HelpCircle, Layers, Zap } from 'lucide-react';

interface NavbarProps {
  isConnected: boolean;
  onOpenArchitecture: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isConnected, onOpenArchitecture }) => {
  return (
    <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">ARHAM</span>
              <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded font-bold bg-blue-900/60 text-blue-400 border border-blue-700/50">
                Fintech
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">BSE Exchange Trade Ingestion Terminal</p>
          </div>
        </div>

        {/* Right Actions & Status Badges */}
        <div className="flex items-center space-x-4">
          {/* Timeout Policy Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Network Policy: <strong>Max 30s HTTP Limit</strong></span>
          </div>

          {/* WebSocket Connection Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            isConnected 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>{isConnected ? 'Real-Time WS Active' : 'Connecting WS...'}</span>
          </div>

          {/* Architecture Modal Button */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Architecture Note</span>
          </button>
        </div>
      </div>
    </header>
  );
};
