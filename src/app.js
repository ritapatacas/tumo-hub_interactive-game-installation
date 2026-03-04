import { ScreenManager } from "./core/ScreenManager.js";
import { UI } from "./core/ui.js";
import { createOverlays } from "./core/domOverlays.js";
import { serial } from "./serial.js";

// Student configuration (screens + actions + flow)
import { theme, actions, screens } from "../change-me/app.js";

const TEAMS_STORAGE_KEY = "tumo_hub_teams";

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

export async function createApp(mountEl) {
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
  const sm = new ScreenManager({ ui, actions, state, teamsStorageKey: TEAMS_STORAGE_KEY });

  // Serial: cada botão (red, blue, yellow, white) mapeia para opção do quiz (0–3)
  if (serial.isSupported()) {
    serial.onButtonPress((optionIndex) => ui.simulateQuizOptionClick(optionIndex));
  }

  for (const screen of screens) sm.register(screen);

  sm.goTo("template");
  window.addEventListener("resize", () => ui.onResize());
}
