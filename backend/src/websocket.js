import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[WS] Client connected (${clients.size} total)`);

    // Send welcome with current timestamp
    ws.send(JSON.stringify({ type: 'connected', time: Date.now() }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected (${clients.size} total)`);
    });

    ws.on('error', () => clients.delete(ws));
  });

  return wss;
}

// Broadcast to all connected clients
export function broadcast(type, data) {
  if (!wss) return;
  const msg = JSON.stringify({ type, data, time: Date.now() });
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      try { client.send(msg); } catch (e) { clients.delete(client); }
    }
  }
}

export function getClientCount() {
  return clients.size;
}
