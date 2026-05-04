function createDefaultWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.hostname}:8787`;
}

function parseRoleFromUrl(params) {
  const player = params.get("player");
  if (player === "1") return "p1";
  if (player === "2") return "p2";
  const p = params.get("p");
  if (p === "1") return "p1";
  if (p === "2") return "p2";
  const legacy = String(params.get("role") || "").toLowerCase();
  if (legacy === "p1") return "p1";
  return "p2";
}

export function getSessionConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    role: parseRoleFromUrl(params),
    sessionId: params.get("s") || params.get("session") || "default",
    wsUrl: params.get("ws") || createDefaultWsUrl(),
  };
}

export class SessionSync {
  constructor({ role, sessionId, wsUrl }) {
    this.role = role;
    this.sessionId = sessionId;
    this.wsUrl = wsUrl;
    this.ws = null;
    this.connected = false;
    this._stateHandler = null;
    this._connectionHandler = null;
    this._reconnectTimer = null;
    this._closedByUser = false;
  }

  onState(handler) {
    this._stateHandler = handler;
  }

  onConnection(handler) {
    this._connectionHandler = handler;
  }

  connect() {
    this._closedByUser = false;
    this._openSocket();
  }

  disconnect() {
    this._closedByUser = true;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  publishScreen({ screen, payload, sharedState }) {
    this._send({
      type: "set_screen",
      sessionId: this.sessionId,
      role: this.role,
      screen,
      payload: payload ?? null,
      sharedState: sharedState ?? {},
      sentAt: Date.now(),
    });
  }

  _emitConnection(connected) {
    this.connected = connected;
    if (typeof this._connectionHandler === "function") {
      this._connectionHandler({ connected });
    }
  }

  _openSocket() {
    try {
      this.ws = new WebSocket(this.wsUrl);
    } catch (err) {
      console.warn("Could not create WebSocket client", err);
      this._scheduleReconnect();
      return;
    }

    this.ws.addEventListener("open", () => {
      this._emitConnection(true);
      this._send({
        type: "join",
        sessionId: this.sessionId,
        role: this.role,
      });
    });

    this.ws.addEventListener("message", (event) => {
      let msg = null;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object") return;
      if (msg.type !== "state_update") return;
      if (typeof this._stateHandler === "function") {
        this._stateHandler(msg);
      }
    });

    this.ws.addEventListener("close", () => {
      this._emitConnection(false);
      this.ws = null;
      this._scheduleReconnect();
    });

    this.ws.addEventListener("error", () => {
      if (this.ws) this.ws.close();
    });
  }

  _scheduleReconnect() {
    if (this._closedByUser) return;
    if (this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._openSocket();
    }, 1500);
  }

  _send(msg) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }
}
