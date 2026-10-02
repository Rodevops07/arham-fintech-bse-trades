import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log(`[WebSocket] New client dashboard connected. Active clients: ${wss?.clients.size}`);

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected. Remaining: ${wss?.clients.size}`);
    });

    ws.on('error', (err) => {
      console.error(`[WebSocket] Client error:`, err);
    });
  });

  return wss;
}

export function broadcast(event: string, payload: any) {
  if (!wss) return;

  const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function getConnectedClientCount(): number {
  return wss ? wss.clients.size : 0;
}
