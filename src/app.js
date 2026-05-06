import { ScreenManager } from "./core/ScreenManager.js";
import { UI } from "./core/ui.js";
import { createOverlays } from "./core/domOverlays.js";
import { serial } from "./serial.js";
import { SessionSync } from "./core/sessionSync.js";
import { resolveInterfaceConfig } from "./interfaceRegistry.js";

import { mergeDummyLeaderboardIfEnabled } from "./core/dummyLeaderboard.js";
import { sanitizeTeams } from "./core/team.js";

const TEAMS_STORAGE_KEY = "tumo_hub_teams";
const SHARED_SCREENS = new Set(["home", "tutorial", "attention", "quiet", "leaderboard"]);
const ROLE_ONLY = {
  video: "p2",
  quiz: "p1",
};
const NOISE_SYNC_MIN_INTERVAL_MS = 120;
const NOISE_SYNC_MIN_DELTA = 0.03;
const INITIAL_SCREEN = "tutorial";

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function resolveVisibleScreen(globalScreen, role, sharedState = null) {
  if (SHARED_SCREENS.has(globalScreen)) {
    return { name: globalScreen, payload: null };
  }
  if (globalScreen === "gallery") {
    return { name: role === "p2" ? "gallery" : "blind-gallery", payload: null };
  }
  const allowedRole = ROLE_ONLY[globalScreen];
  if (!allowedRole || allowedRole === role) {
    return { name: globalScreen, payload: null };
  }
  if (globalScreen === "video" && role === "p1") {
    return { name: "attention", payload: { p1VideoListen: true } };
  }
  if (globalScreen === "quiz" && role === "p2") {
    if (sharedState?.pendingQuizFeedbackDock) {
      return { name: "leaderboard", payload: null };
    }
    return {
      name: "quiet",
      payload: { p2WhileP1Quiz: true },
    };
  }
  return { name: "waiting", payload: { message: "A sessão está a avançar no outro ecrã." } };
}

function extractSharedState(state) {
  return {
    teamName: state.teamName || "",
    teamCode: state.teamCode || "",
    teams: state.teams ?? {},
    selectedVideoSrc: state.selectedVideoSrc || "",
    selectedVideoQuiz: state.selectedVideoQuiz ?? null,
    selectedVideoId: state.selectedVideoId || "",
    gallerySeed: typeof state.gallerySeed === "number" ? state.gallerySeed : 0,
    galleryEpoch: typeof state.galleryEpoch === "number" ? state.galleryEpoch : 0,
    pendingQuizFeedbackDock: state.pendingQuizFeedbackDock ?? null,
    noiseLevelP1: clamp01(state.noiseLevelP1),
    noiseLevelP2: clamp01(state.noiseLevelP2),
  };
}

function applySharedState(state, shared) {
  if (!shared || typeof shared !== "object") return;
  if (typeof shared.teamName === "string") state.teamName = shared.teamName;
  if (typeof shared.teamCode === "string") state.teamCode = shared.teamCode;
  if (shared.teams && typeof shared.teams === "object") state.teams = sanitizeTeams(shared.teams);
  if (typeof shared.selectedVideoSrc === "string") state.selectedVideoSrc = shared.selectedVideoSrc;
  if (Object.prototype.hasOwnProperty.call(shared, "selectedVideoQuiz")) {
    state.selectedVideoQuiz = shared.selectedVideoQuiz;
  }
  if (typeof shared.selectedVideoId === "string") state.selectedVideoId = shared.selectedVideoId;
  if (typeof shared.gallerySeed === "number") state.gallerySeed = shared.gallerySeed;
  if (typeof shared.galleryEpoch === "number") state.galleryEpoch = shared.galleryEpoch;
  if (Object.prototype.hasOwnProperty.call(shared, "pendingQuizFeedbackDock")) {
    state.pendingQuizFeedbackDock = shared.pendingQuizFeedbackDock;
  }
  if (Object.prototype.hasOwnProperty.call(shared, "noiseLevelP1")) {
    state.noiseLevelP1 = clamp01(shared.noiseLevelP1);
  }
  if (Object.prototype.hasOwnProperty.call(shared, "noiseLevelP2")) {
    state.noiseLevelP2 = clamp01(shared.noiseLevelP2);
  }
}

function payloadEqual(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function saveTeamsToStorage(teams) {
  try {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  } catch (error) {
    console.warn("Could not save teams to storage", error);
  }
}

function loadTeamsFromStorage() {
  try {
    const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return sanitizeTeams(data);
  } catch {
    return {};
  }
}

function createApiBaseUrl(sessionConfig) {
  const wsUrl = sessionConfig?.wsUrl;
  if (!wsUrl) {
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  }
  try {
    const url = new URL(wsUrl);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    return url.origin;
  } catch {
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  }
}

async function loadTeamsFromServer(apiBaseUrl) {
  const res = await fetch(`${apiBaseUrl}/api/teams`);
  if (!res.ok) {
    throw new Error(`Could not load teams (${res.status})`);
  }
  const data = await res.json();
  return sanitizeTeams(data?.teams);
}

async function saveTeamsToServer(apiBaseUrl, teams) {
  const safeTeams = sanitizeTeams(teams);
  const res = await fetch(`${apiBaseUrl}/api/teams`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ teams: safeTeams }),
  });
  if (!res.ok) {
    throw new Error(`Could not save teams (${res.status})`);
  }
  const data = await res.json();
  return sanitizeTeams(data?.teams);
}

async function loadSessionStateFromServer(apiBaseUrl, sessionId) {
  const url = new URL(`${apiBaseUrl}/api/session-state`);
  url.searchParams.set("sessionId", sessionId || "default");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load session state (${res.status})`);
  }
  return res.json();
}

export async function createApp(mountEl, sessionConfig) {
  const interfaceConfig = resolveInterfaceConfig(sessionConfig?.interfaceName);
  const { theme, actions, screens } = interfaceConfig;
  const role = sessionConfig?.role === "p2" ? "p2" : "p1";
  const isController = role === "p1";
  const apiBaseUrl = createApiBaseUrl(sessionConfig);
  let teams = loadTeamsFromStorage();

  try {
    teams = await loadTeamsFromServer(apiBaseUrl);
    saveTeamsToStorage(teams);
  } catch (error) {
    console.warn("Could not load teams from sync server, using local cache", error);
  }

  const state = {
    teamName: "",
    teamCode: "",
    teams,
    selectedVideoSrc: "",
    selectedVideoQuiz: null,
    videosData: [],
    noiseLevelP1: 0,
    noiseLevelP2: 0,
  };

  mergeDummyLeaderboardIfEnabled(state);

  const res = await fetch("/assets/data.json");
  if (res.ok) {
    const raw = await res.json();
    const entries = Array.isArray(raw?.videos)
      ? raw.videos
      : Object.values(raw ?? {});

    state.videosData = entries
      .filter((entry) => entry && typeof entry === "object")
      .filter((entry) => typeof entry.videoPath === "string" && entry.videoPath.trim() !== "")
      .map((entry, index) => {
        const id = entry.id || `video-${index + 1}`;
        return {
          id,
          quiz: Array.isArray(entry.quiz) ? entry.quiz : [],
          moreQuestions: Array.isArray(entry.moreQuestions) ? entry.moreQuestions : [],
          videoPath: entry.videoPath,
          thumbnailPath: entry.thumbnailPath || `/assets/thumbnails/${id}.png`,
        };
      });
  }

  const overlays = createOverlays(mountEl);
  const ui = new UI({ mountEl, overlays, theme });
  const sync = new SessionSync({
    role,
    sessionId: sessionConfig?.sessionId || "default",
    wsUrl: sessionConfig?.wsUrl,
  });

  let currentGlobalScreen = INITIAL_SCREEN;
  let currentGlobalPayload = null;
  let currentVisibleScreen = null;
  let currentVisiblePayload = null;
  let lastControllerLocalNavAt = 0;
  let lastPersistPromise = Promise.resolve();
  let lastPublishedNoiseLevel = -1;
  let lastPublishedNoiseAt = 0;
  let verifyPeerScreenTimerId = null;
  let lastRemoteStateAt = 0;
  let sessionPollTimerId = null;

  const noiseLevelKey = role === "p1" ? "noiseLevelP1" : "noiseLevelP2";

  state.publishRoleNoiseLevel = (level, { force = false } = {}) => {
    const safeLevel = clamp01(level);
    state[noiseLevelKey] = safeLevel;

    const now = Date.now();
    const delta = Math.abs(safeLevel - lastPublishedNoiseLevel);
    if (!force && delta < NOISE_SYNC_MIN_DELTA && now - lastPublishedNoiseAt < NOISE_SYNC_MIN_INTERVAL_MS) {
      return;
    }

    lastPublishedNoiseLevel = safeLevel;
    lastPublishedNoiseAt = now;
    sync.publishSharedStatePatch({ [noiseLevelKey]: safeLevel });
  };

  const persistTeams = (nextTeams = state.teams) => {
    const safeTeams = sanitizeTeams(nextTeams);
    state.teams = safeTeams;
    saveTeamsToStorage(safeTeams);
    lastPersistPromise = lastPersistPromise
      .catch(() => {})
      .then(() => saveTeamsToServer(apiBaseUrl, safeTeams))
      .then((savedTeams) => {
        state.teams = savedTeams;
        saveTeamsToStorage(savedTeams);
      })
      .catch((error) => {
        console.warn("Could not persist teams to sync server", error);
      });
    return lastPersistPromise;
  };

  const schedulePeerScreenVerification = (reason = "screen_change") => {
    if (verifyPeerScreenTimerId) {
      clearTimeout(verifyPeerScreenTimerId);
    }
    verifyPeerScreenTimerId = setTimeout(() => {
      verifyPeerScreenTimerId = null;
      sync.requestState(reason);
    }, 120);
  };

  const renderGlobal = (screenName, payload) => {
    currentGlobalScreen = screenName;
    currentGlobalPayload = payload ?? null;
    const visible = resolveVisibleScreen(screenName, role, state);
    const finalPayload = visible.payload ?? currentGlobalPayload;
    const visibleChanged =
      visible.name !== currentVisibleScreen || !payloadEqual(finalPayload, currentVisiblePayload);
    currentVisibleScreen = visible.name;
    currentVisiblePayload = finalPayload ?? null;
    if (visibleChanged) {
      schedulePeerScreenVerification("visible_screen_changed");
    }
    return sm.goTo(visible.name, finalPayload, { fromSync: true });
  };

  state.forceVisibleScreen = (screenName, payload = null) => renderGlobal(screenName, payload);

  const applyRemoteStateMessage = (msg) => {
    const screenName = msg.screen || INITIAL_SCREEN;
    const payload = msg.payload ?? null;
    const updatedAt = typeof msg.updatedAt === "number" ? msg.updatedAt : Date.now();

    if (updatedAt < lastRemoteStateAt) {
      return;
    }

    applySharedState(state, msg.sharedState);
    saveTeamsToStorage(state.teams ?? {});
    mergeDummyLeaderboardIfEnabled(state);

    const sameGlobalScreen = screenName === currentGlobalScreen && payloadEqual(payload, currentGlobalPayload);
    const visible = resolveVisibleScreen(screenName, role, state);
    const nextVisiblePayload = visible.payload ?? payload;
    const sameVisibleScreen =
      visible.name === currentVisibleScreen && payloadEqual(nextVisiblePayload, currentVisiblePayload);

    if (isController && lastControllerLocalNavAt > 0 && updatedAt < lastControllerLocalNavAt) {
      return;
    }

    lastRemoteStateAt = updatedAt;

    if (sameGlobalScreen && sameVisibleScreen) {
      return;
    }

    renderGlobal(screenName, payload);
  };

  const scheduleSessionStatePoll = () => {
    if (role !== "p2") return;
    if (sessionPollTimerId) {
      clearTimeout(sessionPollTimerId);
    }
    sessionPollTimerId = setTimeout(async () => {
      sessionPollTimerId = null;
      try {
        const msg = await loadSessionStateFromServer(apiBaseUrl, sessionConfig?.sessionId || "default");
        if (msg?.type === "state_update") {
          applyRemoteStateMessage(msg);
        }
      } catch (error) {
        console.warn("Could not poll session state", error);
      } finally {
        scheduleSessionStatePoll();
      }
    }, 700);
  };

  const sm = new ScreenManager({
    ui,
    actions,
    state,
    teamsStorageKey: TEAMS_STORAGE_KEY,
    onPersistTeams: persistTeams,
    canRunAction: (actionName) =>
      isController ||
      actionName === "videoEndedAdvance" ||
      actionName === "advanceFromAttention" ||
      actionName === "advanceFromQuiet" ||
      actionName === "noisePenalty",
    onNavigateRequest: async ({ name, payload, meta, perform }) => {
      if (meta?.fromSync) {
        return perform(name, payload);
      }
      if (!isController) {
        return null;
      }
      lastControllerLocalNavAt = Date.now();
      currentGlobalScreen = name;
      currentGlobalPayload = payload ?? null;
      sync.publishScreen({
        screen: currentGlobalScreen,
        payload: currentGlobalPayload,
        sharedState: extractSharedState(state),
      });
      return renderGlobal(currentGlobalScreen, currentGlobalPayload);
    },
  });

  if (isController && serial.isSupported()) {
    serial.onButtonPress((optionIndex) => ui.simulateQuizOptionClick(optionIndex));
  }

  for (const screen of screens) sm.register(screen);

  document.body.dataset.interface = sessionConfig?.interfaceName || "default";
  document.body.dataset.role = role;
  document.body.dataset.connection = "disconnected";

  sync.onConnection(({ connected }) => {
    document.body.dataset.connection = connected ? "connected" : "disconnected";
    if (!connected || !isController) return;
    sync.publishScreen({
      screen: currentGlobalScreen,
      payload: currentGlobalPayload,
      sharedState: extractSharedState(state),
    });
  });

  sync.onState((msg) => {
    applyRemoteStateMessage(msg);
  });

  sync.connect();
  scheduleSessionStatePoll();
  if (isController) {
    await lastPersistPromise;
  }

  renderGlobal(INITIAL_SCREEN, null);
  window.addEventListener("resize", () => ui.onResize());
}
