import { useState, useEffect, useRef, useCallback } from 'react';

export interface IngestionStatus {
  status: 'IDLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  runId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  currentBatch: number;
  totalBatches: number;
  tradesPulledInRun: number;
  totalTradesInDb: number;
  lastBatchDurationMs: number;
  targetDelaySeconds: number;
  elapsedSeconds: number;
  etaSeconds: number;
  error?: string | null;
}

export function useTradesWebSocket(onPullCompleted?: (payload: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [pullStatus, setPullStatus] = useState<IngestionStatus>({
    status: 'IDLE',
    runId: null,
    startedAt: null,
    completedAt: null,
    currentBatch: 0,
    totalBatches: 0,
    tradesPulledInRun: 0,
    totalTradesInDb: 0,
    lastBatchDurationMs: 0,
    targetDelaySeconds: 900,
    elapsedSeconds: 0,
    etaSeconds: 0,
    error: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const onPullCompletedRef = useRef(onPullCompleted);
  onPullCompletedRef.current = onPullCompleted;

  // Fetch initial pull status upon mount
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/pull-status');
      if (res.ok) {
        const data = await res.json();
        setPullStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch initial status:', err);
    }
  }, []);

  const connect = useCallback(() => {
    // Connect to WebSocket via window location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`[WS Hook] Connecting to ${wsUrl}...`);
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('[WS Hook] Connected successfully');
      setIsConnected(true);
      fetchStatus();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event: eventName, payload } = data;

        if (eventName === 'PULL_STARTED') {
          setPullStatus(payload);
        } else if (eventName === 'PULL_PROGRESS') {
          setPullStatus(payload);
        } else if (eventName === 'PULL_COMPLETED') {
          setPullStatus(payload);
          if (onPullCompletedRef.current) {
            onPullCompletedRef.current(payload);
          }
        } else if (eventName === 'PULL_FAILED' || eventName === 'PULL_CANCELLED') {
          setPullStatus(payload);
        }
      } catch (e) {
        console.error('[WS Hook] Error parsing message:', e);
      }
    };

    socket.onclose = () => {
      console.warn('[WS Hook] Disconnected. Reconnecting in 2s...');
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
    };

    socket.onerror = (err) => {
      console.error('[WS Hook] WebSocket error:', err);
    };
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect, fetchStatus]);

  const triggerPull = async (delaySeconds: number = 900) => {
    const res = await fetch('/api/pull/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delaySeconds })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start pull');
    }
    return await res.json();
  };

  const cancelPull = async () => {
    await fetch('/api/pull/cancel', { method: 'POST' });
  };

  const resetData = async () => {
    const res = await fetch('/api/trades/reset', { method: 'POST' });
    fetchStatus();
    return res.json();
  };

  return {
    isConnected,
    pullStatus,
    triggerPull,
    cancelPull,
    resetData,
    refreshStatus: fetchStatus
  };
}
