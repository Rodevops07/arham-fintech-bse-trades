import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsHeader } from './components/MetricsHeader';
import { PullControlPanel } from './components/PullControlPanel';
import { TradesTable } from './components/TradesTable';
import { ArchitectureModal } from './components/ArchitectureModal';
import { useTradesWebSocket } from './hooks/useTradesWebSocket';
import { DbTrade } from '../server/db';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [trades, setTrades] = useState<DbTrade[]>([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [summary, setSummary] = useState({
    totalTrades: 0,
    totalVolume: 0,
    grossValue: 0,
    avgPrice: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Table Controls
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedSide, setSelectedSide] = useState('');

  // UI Highlight for new trades
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);

  // Fetch trades from SQLite database instantly
  const fetchTrades = useCallback(async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) setIsLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        ...(search ? { search } : {}),
        ...(selectedSymbol ? { symbol: selectedSymbol } : {}),
        ...(selectedSide ? { side: selectedSide } : {})
      });

      const res = await fetch(`/api/trades?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        
        if (isAutoRefresh) {
          const oldIds = new Set(trades.map((t) => t.trade_id));
          const newIds = new Set<string>();
          for (const t of data.trades) {
            if (!oldIds.has(t.trade_id)) {
              newIds.add(t.trade_id);
            }
          }
          if (newIds.size > 0) {
            setRecentlyAddedIds(newIds);
            setTimeout(() => setRecentlyAddedIds(new Set()), 5000);
          }
        }

        setTrades(data.trades);
        setTotalTrades(data.total);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, selectedSymbol, selectedSide, trades]);

  // Handle real-time completion event from WebSocket
  const handlePullCompleted = useCallback((payload: any) => {
    console.log('[App] Received PULL_COMPLETED event via WebSocket!', payload);
    const count = payload.totalNewTrades || payload.tradesPulledInRun || 'all';
    setToastMessage(`🎉 Pull Completed! ${count} trades synchronized into dashboard automatically without refresh.`);
    setTimeout(() => setToastMessage(null), 6000);
    fetchTrades(true);
  }, [fetchTrades]);

  // WebSocket Hook (NO POLLING LOOP)
  const {
    isConnected,
    pullStatus,
    triggerPull,
    cancelPull,
    resetData
  } = useTradesWebSocket(handlePullCompleted);

  // Fetch instantly upon mount
  useEffect(() => {
    fetchTrades();
  }, [currentPage, pageSize, search, selectedSymbol, selectedSide]);

  const handleReset = async () => {
    await resetData();
    setCurrentPage(1);
    fetchTrades();
  };

  const totalPages = Math.ceil(totalTrades / pageSize);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar
        isConnected={isConnected}
        onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
      />

      {/* Floating Real-Time Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold border border-emerald-500">
            <Sparkles className="w-5 h-5 text-emerald-100 flex-shrink-0 animate-spin" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Metric KPI Cards */}
        <MetricsHeader
          summary={summary}
          pullStatus={pullStatus}
        />

        {/* Pull Ingestion Controller */}
        <PullControlPanel
          pullStatus={pullStatus}
          onTriggerPull={triggerPull}
          onCancelPull={cancelPull}
          onResetData={handleReset}
        />

        {/* Live Trades Table */}
        <TradesTable
          trades={trades}
          totalTrades={totalTrades}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          selectedSymbol={selectedSymbol}
          onSymbolChange={(val) => {
            setSelectedSymbol(val);
            setCurrentPage(1);
          }}
          selectedSide={selectedSide}
          onSideChange={(val) => {
            setSelectedSide(val);
            setCurrentPage(1);
          }}
          recentlyAddedIds={recentlyAddedIds}
          isLoading={isLoading}
        />
      </main>

      {/* Architecture & Design Modal */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />
    </div>
  );
};
