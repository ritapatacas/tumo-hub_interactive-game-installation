import { createServer } from "node:http";
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEAMS_FILE = path.join(__dirname, "teams.json");
const port = Number(process.env.SYNC_PORT || 8787);
const sessions = new Map();
const server = createServer(handleRequest);
const wss = new WebSocketServer({ server });
const TEAM_CODE_PATTERN = /^#[A-Z0-9]{4}$/;
const TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let persistedTeams = await loadTeams();

function cloneTeams(teams = persistedTeams) {
  return JSON.parse(JSON.stringify(teams));
}

function normalizeCode(value) {
  return String(value ?? "").trim().toUpperCase();
}

function isTeamCode(value) {
  return TEAM_CODE_PATTERN.test(normalizeCode(value));
}

function generateTeamCode(teams) {
  const existing = new Set(Object.keys(teams || {}).map((code) => normalizeCode(code)));
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    let code = "#";
    for (let i = 0; i < 4; i += 1) {
      const index = Math.floor(Math.random() * TEAM_CODE_ALPHABET.length);
      code += TEAM_CODE_ALPHABET[index];
    }
    if (!existing.has(code)) return code;
  }
  throw new Error("Could not generate a unique team code.");
}

function createTeamRecord(name, code, points = 0) {
  return {
    code: normalizeCode(code),
    name: String(name ?? "").trim() || "Equipa",
    points: Number.isFinite(Number(points)) ? Math.max(0, Math.round(Number(points))) : 0,
    viewedVideoIds: [],
    answeredQuestionIds: [],
    quizHistory: {},
  };
}

function sanitizeStringList(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const next = [];
  for (const item of items) {
    const value = String(item ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    next.push(value);
  }
  return next;
}

function sanitizeQuizHistory(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const next = {};
  for (const [videoId, rawQuestions] of Object.entries(input)) {
    const safeVideoId = String(videoId ?? "").trim();
    if (!safeVideoId || !rawQuestions || typeof rawQuestions !== "object" || Array.isArray(rawQuestions)) continue;
    const safeQuestions = {};
    for (const [questionId, rawAttempts] of Object.entries(rawQuestions)) {
      const safeQuestionId = String(questionId ?? "").trim();
      if (!safeQuestionId || !Array.isArray(rawAttempts)) continue;
      safeQuestions[safeQuestionId] = rawAttempts.map((value) => !!value);
    }
    if (Object.keys(safeQuestions).length > 0) {
      next[safeVideoId] = safeQuestions;
    }
  }
  return next;
}

function ensureSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      screen: "home",
      payload: null,
      updatedAt: Date.now(),
      sharedState: {
        teamName: "",
        teamCode: "",
        teams: cloneTeams(),
      },
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

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sanitizeTeams(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const next = {};
  for (const [rawKey, rawValue] of Object.entries(input)) {
    if (typeof rawValue === "number") {
      const name = String(rawKey ?? "").trim();
      if (!name) continue;
      const code = generateTeamCode(next);
      next[code] = createTeamRecord(name, code, rawValue);
      continue;
    }
    if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) continue;
    const name = String(rawValue.name ?? rawKey ?? "").trim();
    if (!name) continue;
    let code = normalizeCode(rawValue.code || rawKey);
    if (!isTeamCode(code) || next[code]) {
      code = generateTeamCode(next);
    }
    const record = createTeamRecord(name, code, rawValue.points);
    record.viewedVideoIds = sanitizeStringList(rawValue.viewedVideoIds);
    record.answeredQuestionIds = sanitizeStringList(rawValue.answeredQuestionIds);
    record.quizHistory = sanitizeQuizHistory(rawValue.quizHistory);
    next[code] = record;
  }
  return next;
}

async function loadTeams() {
  try {
    const raw = await readFile(TEAMS_FILE, "utf8");
    return sanitizeTeams(JSON.parse(raw));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      await saveTeams({});
      return {};
    }
    console.error("Could not load teams file", error);
    return {};
  }
}

async function saveTeams(teams) {
  const safeTeams = sanitizeTeams(teams);
  const tempFile = `${TEAMS_FILE}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(safeTeams, null, 2)}\n`, "utf8");
  await rename(tempFile, TEAMS_FILE);
  persistedTeams = safeTeams;
  for (const session of sessions.values()) {
    if (!session.sharedState || typeof session.sharedState !== "object") {
      session.sharedState = {};
    }
    session.sharedState.teams = cloneTeams(safeTeams);
  }
  return safeTeams;
}

async function handleRequest(req, res) {
  if (!req.url) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (url.pathname === "/api/teams" && req.method === "GET") {
    sendJson(res, 200, { teams: cloneTeams() });
    return;
  }

  if (url.pathname === "/api/teams" && req.method === "PUT") {
    try {
      const body = await readJsonBody(req);
      const teams = await saveTeams(body?.teams);
      sendJson(res, 200, { teams: cloneTeams(teams) });
    } catch (error) {
      console.error("Could not save teams file", error);
      sendJson(res, 400, { error: "Invalid teams payload" });
    }
    return;
  }

  if (url.pathname === "/api/session-state" && req.method === "GET") {
    const sessionId = String(url.searchParams.get("sessionId") || "default");
    const session = ensureSession(sessionId);
    sendJson(res, 200, {
      type: "state_update",
      sessionId,
      screen: session.screen,
      payload: session.payload,
      sharedState: session.sharedState,
      updatedAt: session.updatedAt,
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
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
    updatedAt: session.updatedAt,
  };
  for (const client of session.clients) {
    send(client, message);
  }
}

wss.on("connection", (ws) => {
  ws._sessionId = null;
  ws._role = "p1";

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
      const role = msg.role === "p2" ? "p2" : "p1";
      ws._sessionId = sessionId;
      ws._role = role;
      const session = ensureSession(sessionId);
      session.clients.add(ws);
      broadcastState(sessionId);
      return;
    }

    if (msg.type === "set_screen") {
      if (ws._role !== "p1") return;
      const sessionId = ws._sessionId || String(msg.sessionId || "default");
      const session = ensureSession(sessionId);
      session.screen = String(msg.screen || "home");
      session.payload = toJsonSafe(msg.payload) ?? null;
      session.updatedAt = Date.now();
      session.sharedState = toJsonSafe(msg.sharedState) ?? {};
      if (!session.sharedState.teams || typeof session.sharedState.teams !== "object") {
        session.sharedState.teams = cloneTeams();
      }
      if (typeof session.sharedState.teamCode !== "string") {
        session.sharedState.teamCode = "";
      }
      broadcastState(sessionId);
      return;
    }

    if (msg.type === "patch_shared_state") {
      const sessionId = ws._sessionId || String(msg.sessionId || "default");
      const session = ensureSession(sessionId);
      const patch = toJsonSafe(msg.patch);
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) return;
      session.updatedAt = Date.now();
      session.sharedState = {
        ...(session.sharedState && typeof session.sharedState === "object" ? session.sharedState : {}),
        ...patch,
      };
      if (!session.sharedState.teams || typeof session.sharedState.teams !== "object") {
        session.sharedState.teams = cloneTeams();
      }
      if (typeof session.sharedState.teamCode !== "string") {
        session.sharedState.teamCode = "";
      }
      broadcastState(sessionId);
      return;
    }

    if (msg.type === "request_state") {
      const sessionId = ws._sessionId || String(msg.sessionId || "default");
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

server.listen(port, () => {
  console.log(`Sync server listening on ws://0.0.0.0:${port}`);
});
