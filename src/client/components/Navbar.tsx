import React from 'react';
import { Activity, ShieldCheck, Layers } from 'lucide-react';

interface NavbarProps {
  isConnected: boolean;
  onOpenArchitecture: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isConnected, onOpenArchitecture }) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40 px-6 py-4 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">ARHAM</span>
              <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Fintech
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">BSE Exchange Trade Ingestion Terminal</p>
          </div>
        </div>

        {/* Right Badges & Actions */}
        <div className="flex items-center space-x-3">
          {/* Timeout Policy Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Network Policy: <strong className="font-semibold text-amber-900">Max 30s HTTP Limit</strong></span>
          </div>

          {/* WebSocket Connection Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            isConnected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{isConnected ? 'Real-Time WS Active' : 'Connecting WS...'}</span>
          </div>

          {/* Architecture Note Button */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Architecture Note</span>
          </button>
        </div>
      </div>
    </header>
  );
};
