import { theme } from "./theme.js";
import { persistStateTeam, applyNoisePenalty, showNoisePenalty } from "../src/core/team.js";
import { selectVideoFromPayload } from "../src/core/video.js";
import { serial } from "../src/serial.js";
import { onQuizAnswered } from "./screens/quiz.screen.js";
import { templateScreen } from "./screens/template.screen.js";
import { homeScreen } from "./screens/home.screen.js";
import { galleryScreen } from "./screens/gallery.screen.js";
import { quizScreen } from "./screens/quiz.screen.js";
import { videoScreen } from "./screens/video.screen.js";
import { leaderboardScreen } from "./screens/leaderboard.screen.js";
import { tutorialScreen } from "./screens/tutorial.screen.js";

export { theme };

export const POINTS_PER_CORRECT = 10;
export const POINTS_NOISE_PENALTY = 5;

export const screens = [
  templateScreen,
  homeScreen,
  tutorialScreen,
  galleryScreen,
  quizScreen,
  videoScreen,
  leaderboardScreen,
];

export const actions = {
  goTemplate: ({ goTo }) => goTo("template"),
  goHome: ({ goTo }) => goTo("home"),
  goTutorial: ({ goTo }) => goTo("tutorial"),
  goGallery: ({ goTo }) => goTo("gallery"),
  goQuiz: ({ goTo }) => goTo("quiz"),
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

  noisePenalty: (ctx) => {
    const penalty = POINTS_NOISE_PENALTY;
    const team = applyNoisePenalty(ctx, penalty);
    showNoisePenalty(ctx, team, penalty);
  },

  openVideoFromGallery: (ctx) => {
    selectVideoFromPayload(ctx);
    ctx.goTo("video");
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
