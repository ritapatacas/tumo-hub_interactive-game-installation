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
import { preGalleryScreen } from "./screens/pre-gallery.screen.js";
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

export const screens = [
  homeScreen,
  tutorialScreen,
  preGalleryScreen,
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
  goTutorial: ({ goTo }) => goTo("tutorial"),
  goPreGallery: ({ goTo }) => goTo("preGallery"),
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
    persistStateTeam(ctx);
    ctx.goTo("tutorial");
  },

  pointsPerCorrect: POINTS_PER_CORRECT,

  quizAnswered: (ctx) => {
    onQuizAnswered(ctx);
    ctx.state.gallerySeed = (Math.random() * 0x7fffffff) | 0;
    ctx.state.galleryEpoch = Date.now();
    ctx.goTo("gallery");
  },

  // Timeout do quiz: sem resposta até ao fim => sai com 0 pontos neste round.
  quizTimeout: (ctx) => {
    ctx.ui.showMessage("Tempo esgotado. 0 pontos.", { type: "error" });
    ctx.state.gallerySeed = (Math.random() * 0x7fffffff) | 0;
    ctx.state.galleryEpoch = Date.now();
    ctx.goTo("gallery");
  },

  noisePenalty: (ctx) => {
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
    const msg = payload.isCorrect ? "Resposta certa!" : "Resposta errada.";
    ctx.ui.showMessage(msg, { type: payload.isCorrect ? "success" : "error", duration: 2000 });
  },

  /** Exemplo no template: ao carregar Enter no input. */
  templateInputSubmit: (ctx) => {
    const value = ctx.ui.getInputValue("templateInput");
    ctx.ui.showMessage(value ? `Enviado: ${value}` : "Escreve algo primeiro.", { type: "info" });
  },
};
