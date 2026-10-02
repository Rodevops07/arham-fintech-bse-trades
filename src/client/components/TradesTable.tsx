import React from 'react';
import { Search, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { DbTrade } from '../../server/db';

interface TradesTableProps {
  trades: DbTrade[];
  totalTrades: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  search: string;
  onSearchChange: (val: string) => void;
  selectedSymbol: string;
  onSymbolChange: (val: string) => void;
  selectedSide: string;
  onSideChange: (val: string) => void;
  recentlyAddedIds: Set<string>;
  isLoading: boolean;
}

const COMMON_SYMBOLS = [
  'ALL',
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'TATAMOTORS',
  'SBIN',
  'ITC',
  'BHARTIARTL',
  'LT'
];

export const TradesTable: React.FC<TradesTableProps> = ({
  trades,
  totalTrades,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
  selectedSymbol,
  onSymbolChange,
  selectedSide,
  onSideChange,
  recentlyAddedIds,
  isLoading
}) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Trade ID, Symbol, Client Code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-semibold">Symbol:</span>
            <select
              value={selectedSymbol}
              onChange={(e) => onSymbolChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 px-3 py-1.5 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {COMMON_SYMBOLS.map((s) => (
                <option key={s} value={s === 'ALL' ? '' : s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Side Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-semibold">Side:</span>
            <select
              value={selectedSide}
              onChange={(e) => onSideChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 px-3 py-1.5 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">ALL</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          {/* Page Size */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-semibold">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 px-3 py-1.5 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container with soft light shimmer */}
      <div className="overflow-x-auto min-h-[420px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
            <tr>
              <th className="px-4.5 py-3.5">Trade ID</th>
              <th className="px-4.5 py-3.5">Time</th>
              <th className="px-4.5 py-3.5">Symbol</th>
              <th className="px-4.5 py-3.5 text-center">Side</th>
              <th className="px-4.5 py-3.5 text-right">Quantity</th>
              <th className="px-4.5 py-3.5 text-right">Price (₹)</th>
              <th className="px-4.5 py-3.5 text-right">Total Value (₹)</th>
              <th className="px-4.5 py-3.5">Client Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trades.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4.5 py-16 text-center text-slate-400 font-medium">
                  {isLoading ? 'Loading trades...' : 'No trades found matching current criteria.'}
                </td>
              </tr>
            ) : (
              trades.map((trade) => {
                const isNew = recentlyAddedIds.has(trade.trade_id);
                return (
                  <tr
                    key={trade.trade_id}
                    className={`transition-colors duration-200 hover:bg-blue-50/30 ${
                      isNew 
                        ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500' 
                        : ''
                    }`}
                  >
                    {/* Trade ID with soft shimmer icon */}
                    <td className="px-4.5 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {isNew && (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse flex-shrink-0" />
                        )}
                        <span>{trade.trade_id}</span>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-4.5 py-3 text-slate-500 whitespace-nowrap font-mono">
                      <span>{formatDate(trade.timestamp)} </span>
                      <span className="text-slate-800 font-semibold">{formatTime(trade.timestamp)}</span>
                    </td>

                    {/* Symbol with clean light badge */}
                    <td className="px-4.5 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-md font-bold font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200">
                        {trade.symbol}
                      </span>
                    </td>

                    {/* Side */}
                    <td className="px-4.5 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          trade.side === 'BUY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {trade.side}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-4.5 py-3 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                      {trade.quantity.toLocaleString('en-IN')}
                    </td>

                    {/* Price */}
                    <td className="px-4.5 py-3 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                      ₹{trade.price.toFixed(2)}
                    </td>

                    {/* Total Value */}
                    <td className="px-4.5 py-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      ₹{trade.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Client */}
                    <td className="px-4.5 py-3 font-mono text-slate-600 whitespace-nowrap font-medium">
                      {trade.client}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <div>
          Showing{' '}
          <strong className="text-slate-800 font-mono font-bold">
            {trades.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{' '}
          to{' '}
          <strong className="text-slate-800 font-mono font-bold">
            {Math.min(currentPage * pageSize, totalTrades)}
          </strong>{' '}
          of <strong className="text-slate-800 font-mono font-bold">{totalTrades.toLocaleString('en-IN')}</strong> total trades
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-mono text-slate-800 font-semibold shadow-xs">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium shadow-xs"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
