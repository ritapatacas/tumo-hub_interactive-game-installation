import { theme } from "./theme.js";
import { persistStateTeam, applyNoisePenalty, showNoisePenalty } from "../src/core/team.js";
import { selectVideoFromPayload } from "../src/core/video.js";
import { resolveGalleryItems } from "../src/core/gallery.js";
import { serial } from "../src/serial.js";
import { onQuizAnswered } from "./screens/quiz.screen.js";
import { homeScreen } from "./screens/home.screen.js";
import { galleryScreen } from "./screens/gallery.screen.js";
import { blindGalleryScreen } from "./screens/blind-gallery.screen.js";
import { quizScreen } from "./screens/quiz.screen.js";
import { quietScreen } from "./screens/quiet.screen.js";
import { videoScreen } from "./screens/video.screen.js";
import { attentionScreen } from "./screens/attention.screen.js";
import { leaderboardScreen } from "./screens/leaderboard.screen.js";
import { tutorialScreen } from "./screens/tutorial.screen.js";
import { waitingScreen } from "./screens/waiting.screen.js";

export { theme };

export const POINTS_PER_CORRECT = 10;
export const POINTS_NOISE_PENALTY = 5;

function openVideoFromGalleryWithPayload(ctx) {
  selectVideoFromPayload(ctx);
  if (ctx.state.__attentionTimerId) {
    clearTimeout(ctx.state.__attentionTimerId);
  }
  ctx.goTo("attention");
  ctx.state.__attentionTimerId = setTimeout(() => {
    ctx.goTo("video");
    ctx.state.__attentionTimerId = null;
  }, 5000);
}

function advanceFromAttentionToVideo(ctx) {
  if (ctx.state.__attentionTimerId) {
    clearTimeout(ctx.state.__attentionTimerId);
    ctx.state.__attentionTimerId = null;
  }
  ctx.goTo("video");
}

function advanceFromQuietToQuiz(ctx) {
  if (ctx.state.__quietTimerId) {
    clearTimeout(ctx.state.__quietTimerId);
    ctx.state.__quietTimerId = null;
  }
  ctx.goTo("quiz");
}

export const screens = [
  homeScreen,
  tutorialScreen,
  galleryScreen,
  blindGalleryScreen,
  quietScreen,
  quizScreen,
  attentionScreen,
  videoScreen,
  leaderboardScreen,
  waitingScreen,
];

export const actions = {
  goHome: ({ goTo }) => goTo("home"),
  /** Limpa a equipa ativa e o contexto desta sessão; volta à home para a próxima equipa. */
  endGameAndGoHome: (ctx) => {
    const s = ctx.state;
    if (s.__attentionTimerId) {
      clearTimeout(s.__attentionTimerId);
      s.__attentionTimerId = null;
    }
    if (s.__quietTimerId) {
      clearTimeout(s.__quietTimerId);
      s.__quietTimerId = null;
    }
    s.teamName = "";
    s.selectedVideoSrc = "";
    s.selectedVideoId = "";
    s.selectedVideoQuiz = null;
    s.pendingQuizFeedbackDock = null;
    s.gallerySeed = 0;
    s.galleryEpoch = 0;
    if (Object.prototype.hasOwnProperty.call(s, "gallerySpotlightIndex")) {
      delete s.gallerySpotlightIndex;
    }
    if (typeof ctx.persistTeams === "function") ctx.persistTeams();
    ctx.goTo("home");
  },
  goTutorial: ({ goTo }) => goTo("tutorial"),
  goGallery: (ctx) => {
    ctx.state.gallerySeed = (Math.random() * 0x7fffffff) | 0;
    ctx.state.galleryEpoch = Date.now();
    ctx.goTo("gallery");
  },
  goQuiz: (ctx) => {
    // Mostra ecrã intermédio "quiet" durante 5s antes do quiz.
    if (ctx.state.__quietTimerId) {
      clearTimeout(ctx.state.__quietTimerId);
    }
    ctx.goTo("quiet");
    ctx.state.__quietTimerId = setTimeout(() => {
      ctx.goTo("quiz");
      ctx.state.__quietTimerId = null;
    }, 10000);
  },
  goQuizNow: ({ goTo }) => goTo("quiz"),
  goVideo: ({ goTo }) => goTo("video"),
  goLeaderboard: ({ goTo }) => goTo("leaderboard"),
  videoEndedAdvance: ({ actions, ...ctx }) => actions.goQuiz(ctx),

  /** Enter no ecrã attention: mesmo efeito que o fim dos 5 s → vídeo. */
  advanceFromAttention: (ctx) => advanceFromAttentionToVideo(ctx),

  /** Enter no ecrã quiet: mesmo efeito que o fim dos 10 s → quiz. */
  advanceFromQuiet: (ctx) => advanceFromQuietToQuiz(ctx),

  /** Conecta à porta serial (Arduino). Cada botão: red→opção 0, blue→1, yellow→2, white→3 no quiz. */
  connectArduino: async (ctx) => {
    if (!serial.isSupported()) {
      ctx.ui.showMessage("Serial não disponível neste browser (usa Chrome/Edge).", { type: "error" });
      return;
    }
    try {
      await serial.connect({ baudRate: 9600 });
      ctx.ui.showMessage("Arduino ligado. Os botões controlam as opções do quiz.", { type: "success" });
    } catch (e) {
      ctx.ui.showMessage(e?.message || "Erro ao ligar Arduino.", { type: "error" });
    }
  },

  saveTeamName: (ctx) => {
    const name = persistStateTeam(ctx);
    if (!name) {
      ctx.ui.showMessage("", {
        dock: "top-left",
        html: "ESCREVE O NOME DA EQUIPA!",
        ariaLabel: "Escreve o nome da equipa.",
        duration: 5000,
      });
      return;
    }
    ctx.goTo("tutorial");
  },

  pointsPerCorrect: POINTS_PER_CORRECT,

  quizAnswered: (ctx) => {
    const { quizFeedbackDock } = onQuizAnswered(ctx);
    ctx.state.pendingQuizFeedbackDock = quizFeedbackDock ?? null;
    ctx.state.gallerySeed = (Math.random() * 0x7fffffff) | 0;
    ctx.state.galleryEpoch = Date.now();
    ctx.goTo("leaderboard");
  },

  // Timeout do quiz: sem resposta até ao fim => sai com 0 pontos neste round.
  quizTimeout: (ctx) => {
    ctx.ui.showMessage("Tempo esgotado. 0 pontos.", { type: "error" });
    ctx.state.gallerySeed = (Math.random() * 0x7fffffff) | 0;
    ctx.state.galleryEpoch = Date.now();
    ctx.goTo("gallery");
  },

  noisePenalty: (ctx) => {
    if (ctx.screen !== "quiz") return;
    const penalty = POINTS_NOISE_PENALTY;
    const team = applyNoisePenalty(ctx, penalty);
    showNoisePenalty(ctx, team, penalty);
  },

  openVideoFromGallery: (ctx) => openVideoFromGalleryWithPayload(ctx),

  /** P2: carrega o vídeo que está em destaque neste momento na grelha. */
  loadSpotlightVideoFromGallery: (ctx) => {
    const items = resolveGalleryItems(ctx.state.videosData ?? []);
    if (!items.length) {
      ctx.ui.showMessage("Nenhum vídeo disponível.", { type: "error" });
      return;
    }
    const idx = Math.max(0, Math.min(items.length - 1, ctx.state.gallerySpotlightIndex ?? 0));
    const it = items[idx];
    ctx.payload = {
      id: it.name,
      name: it.name,
      videoPath: it.src,
      src: it.src,
      thumbnail: it.thumbnail,
    };
    openVideoFromGalleryWithPayload(ctx);
  },

  /** Abre o vídeo já escolhido (último `selectedVideoId`); útil no botão "Ver" da galeria. */
  openSelectedVideo: (ctx) => {
    const id = ctx.state.selectedVideoId;
    const items = ctx.state.videosData ?? [];
    const item = items.find((v) => v.id === id);
    if (!item) {
      ctx.ui.showMessage("Escolhe um vídeo na galeria primeiro.", { type: "info" });
      return;
    }
    ctx.actions.openVideoFromGallery({ ...ctx, payload: item });
  },

  /** Exemplo no template: mostra toast ao responder ao quiz estático. */
  templateQuizAnswer: (ctx) => {
    const payload = ctx.payload ?? {};
    if (payload.isCorrect) {
      ctx.ui.showMessage("", {
        dock: "top-left",
        boxClassName: "ui-shadow-box--docked-success",
        duration: 4500,
        ariaLabel: "Resposta certa.",
        html: "RESPOSTA CERTA!",
      });
    } else {
      ctx.ui.showMessage("", {
        dock: "top-left",
        boxClassName: "ui-shadow-box--docked-error",
        duration: 4500,
        ariaLabel: "Resposta errada.",
        html: "RESPOSTA ERRADA!",
      });
    }
  },

  /** Exemplo no template: ao carregar Enter no input. */
  templateInputSubmit: (ctx) => {
    const value = ctx.ui.getInputValue("templateInput");
    ctx.ui.showMessage(value ? `Enviado: ${value}` : "Escreve algo primeiro.", { type: "info" });
  },
};
