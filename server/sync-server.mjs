import { WebSocketServer } from "ws";

const port = Number(process.env.SYNC_PORT || 8787);
const wss = new WebSocketServer({ port });
const sessions = new Map();

function ensureSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      screen: "home",
      payload: null,
      sharedState: {},
      clients: new Set(),
    });
  }
  return sessions.get(sessionId);
}

function toJsonSafe(value) {
  if (value == null) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function send(ws, data) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(data));
}

function broadcastState(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  const message = {
    type: "state_update",
    sessionId,
    screen: session.screen,
    payload: session.payload,
    sharedState: session.sharedState,
    updatedAt: Date.now(),
  };
  for (const client of session.clients) {
    send(client, message);
  }
}

wss.on("connection", (ws) => {
  ws._sessionId = null;
  ws._role = "p2";

  ws.on("message", (raw) => {
    let msg = null;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "join") {
      const sessionId = String(msg.sessionId || "default");
      const role = msg.role === "p1" ? "p1" : "p2";
      ws._sessionId = sessionId;
      ws._role = role;
      const session = ensureSession(sessionId);
      session.clients.add(ws);
      broadcastState(sessionId);
      return;
    }

    if (msg.type === "set_screen") {
      if (ws._role !== "p2") return;
      const sessionId = ws._sessionId || String(msg.sessionId || "default");
      const session = ensureSession(sessionId);
      session.screen = String(msg.screen || "home");
      session.payload = toJsonSafe(msg.payload) ?? null;
      session.sharedState = toJsonSafe(msg.sharedState) ?? {};
      broadcastState(sessionId);
    }
  });

  ws.on("close", () => {
    const sessionId = ws._sessionId;
    if (!sessionId) return;
    const session = sessions.get(sessionId);
    if (!session) return;
    session.clients.delete(ws);
    if (session.clients.size === 0) {
      sessions.delete(sessionId);
    }
  });
});

console.log(`Sync server listening on ws://0.0.0.0:${port}`);
