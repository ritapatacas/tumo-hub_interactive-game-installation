import { theme } from "./theme.js";
import { persistStateTeam, applyNoisePenalty, showNoisePenalty } from "../src/core/team.js";
import { selectVideoFromPayload } from "../src/core/video.js";
import { serial } from "../src/serial.js";
import { onQuizAnswered } from "./screens/quiz.screen.js";
import { homeScreen } from "./screens/home.screen.js";
import { galleryScreen } from "./screens/gallery.screen.js";
import { quizScreen } from "./screens/quiz.screen.js";
import { quietScreen } from "./screens/quiet.screen.js";
import { videoScreen } from "./screens/video.screen.js";
import { attentionScreen } from "./screens/attention.screen.js";
import { leaderboardScreen } from "./screens/leaderboard.screen.js";
import { tutorialScreen } from "./screens/tutorial.screen.js";

export { theme };

export const POINTS_PER_CORRECT = 10;
export const POINTS_NOISE_PENALTY = 5;

export const screens = [
  homeScreen,
  tutorialScreen,
  galleryScreen,
  quietScreen,
  quizScreen,
  attentionScreen,
  videoScreen,
  leaderboardScreen,
];

export const actions = {
  goHome: ({ goTo }) => goTo("home"),
  goTutorial: ({ goTo }) => goTo("tutorial"),
  goGallery: ({ goTo }) => goTo("gallery"),
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
    ctx.goTo("gallery");
  },

  // Timeout do quiz: sem resposta até ao fim => sai com 0 pontos neste round.
  quizTimeout: (ctx) => {
    ctx.ui.showMessage("Tempo esgotado. 0 pontos.", { type: "error" });
    ctx.goTo("gallery");
  },

  noisePenalty: (ctx) => {
    const penalty = POINTS_NOISE_PENALTY;
    const team = applyNoisePenalty(ctx, penalty);
    showNoisePenalty(ctx, team, penalty);
  },

  openVideoFromGallery: (ctx) => {
    selectVideoFromPayload(ctx);
    // Mostra ecrã intermédio "attention" durante 5s antes do vídeo.
    if (ctx.state.__attentionTimerId) {
      clearTimeout(ctx.state.__attentionTimerId);
    }
    ctx.goTo("attention");
    ctx.state.__attentionTimerId = setTimeout(() => {
      ctx.goTo("video");
      ctx.state.__attentionTimerId = null;
    }, 5000);
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
