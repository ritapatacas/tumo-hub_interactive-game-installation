import { ScreenManager } from "./core/ScreenManager.js";
import { UI } from "./core/ui.js";
import { createOverlays } from "./core/domOverlays.js";
import { serial } from "./serial.js";
import { SessionSync } from "./core/sessionSync.js";

// Student configuration (screens + actions + flow)
import { theme, actions, screens } from "../change-me/app.js";

const TEAMS_STORAGE_KEY = "tumo_hub_teams";
const SHARED_SCREENS = new Set(["home", "tutorial", "attention", "quiet", "leaderboard"]);
const ROLE_ONLY = {
  video: "p1",
  quiz: "p2",
};

function resolveVisibleScreen(globalScreen, role) {
  if (SHARED_SCREENS.has(globalScreen)) {
    return { name: globalScreen, payload: null };
  }
  if (globalScreen === "gallery") {
    return { name: role === "p1" ? "gallery" : "blind-gallery", payload: null };
  }
  const allowedRole = ROLE_ONLY[globalScreen];
  if (!allowedRole || allowedRole === role) {
    return { name: globalScreen, payload: null };
  }
  if (globalScreen === "video" && role === "p2") {
    return { name: "attention", payload: { p2VideoListen: true } };
  }
  if (globalScreen === "quiz" && role === "p1") {
    return {
      name: "quiet",
      payload: { p1WhileP2Quiz: true },
    };
  }
  return { name: "waiting", payload: { message: "A sessão está a avançar no outro ecrã." } };
}

function extractSharedState(state) {
  return {
    teamName: state.teamName || "",
    teams: state.teams ?? {},
    selectedVideoSrc: state.selectedVideoSrc || "",
    selectedVideoQuiz: state.selectedVideoQuiz ?? null,
    selectedVideoId: state.selectedVideoId || "",
    gallerySeed: typeof state.gallerySeed === "number" ? state.gallerySeed : 0,
    galleryEpoch: typeof state.galleryEpoch === "number" ? state.galleryEpoch : 0,
  };
}

function applySharedState(state, shared) {
  if (!shared || typeof shared !== "object") return;
  if (typeof shared.teamName === "string") state.teamName = shared.teamName;
  if (shared.teams && typeof shared.teams === "object") state.teams = shared.teams;
  if (typeof shared.selectedVideoSrc === "string") state.selectedVideoSrc = shared.selectedVideoSrc;
  if (Object.prototype.hasOwnProperty.call(shared, "selectedVideoQuiz")) {
    state.selectedVideoQuiz = shared.selectedVideoQuiz;
  }
  if (typeof shared.selectedVideoId === "string") state.selectedVideoId = shared.selectedVideoId;
  if (typeof shared.gallerySeed === "number") state.gallerySeed = shared.gallerySeed;
  if (typeof shared.galleryEpoch === "number") state.galleryEpoch = shared.galleryEpoch;
}

function loadTeamsFromStorage() {
  try {
    const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

export async function createApp(mountEl, sessionConfig) {
  const role = sessionConfig?.role === "p1" ? "p1" : "p2";
  const isController = role === "p2";
  const state = {
    teamName: "",
    teams: loadTeamsFromStorage(),
    selectedVideoSrc: "",
    selectedVideoQuiz: null,
    videosData: [],
  };

  // Carrega as perguntas a partir de perguntas.json
  const res = await fetch("/perguntas.json");
  if (res.ok) {
    const raw = await res.json();
    const entries = Object.values(raw ?? {});

    state.videosData = entries.map((entry, index) => {
      const id = entry.id || `video-${index + 1}`;
      return {
        id,
        quiz: entry.quiz ?? [],
        // Usa o id para resolver automaticamente os paths
        videoPath: `/assets/videos/${id}.mp4`,
        thumbnailPath: `/assets/thumbnails/${id}.png`,
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

  let currentGlobalScreen = "home";
  let currentGlobalPayload = null;
  /** Evita que o P2 reaplique um ecrã antigo do sync (ex. gallery) depois de ir para tutorial. */
  let lastControllerLocalNavAt = 0;

  const renderGlobal = (screenName, payload) => {
    currentGlobalScreen = screenName;
    currentGlobalPayload = payload ?? null;
    const visible = resolveVisibleScreen(screenName, role);
    const finalPayload = visible.payload ?? currentGlobalPayload;
    return sm.goTo(visible.name, finalPayload, { fromSync: true });
  };

  const sm = new ScreenManager({
    ui,
    actions,
    state,
    teamsStorageKey: TEAMS_STORAGE_KEY,
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

  // Serial: cada botão (red, blue, yellow, white) mapeia para opção do quiz (0–3)
  if (isController && serial.isSupported()) {
    serial.onButtonPress((optionIndex) => ui.simulateQuizOptionClick(optionIndex));
  }

  for (const screen of screens) sm.register(screen);

  document.body.dataset.role = role;
  document.body.dataset.connection = "disconnected";

  sync.onConnection(({ connected }) => {
    document.body.dataset.connection = connected ? "connected" : "disconnected";
  });

  sync.onState((msg) => {
    applySharedState(state, msg.sharedState);
    if (
      isController &&
      lastControllerLocalNavAt > 0 &&
      typeof msg.updatedAt === "number" &&
      msg.updatedAt < lastControllerLocalNavAt
    ) {
      return;
    }
    renderGlobal(msg.screen || "home", msg.payload ?? null);
  });

  sync.connect();
  if (isController) {
    sync.publishScreen({
      screen: currentGlobalScreen,
      payload: currentGlobalPayload,
      sharedState: extractSharedState(state),
    });
  }

  renderGlobal("home", null);
  window.addEventListener("resize", () => ui.onResize());
}
