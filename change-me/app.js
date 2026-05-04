import { theme } from "./theme.js";
import {
  openVideoFromGalleryWithPayload,
  advanceFromAttentionToVideo,
  advanceFromQuietToQuiz,
  startQuietThenQuiz,
  endGameAndReset,
  connectArduino,
  loadSpotlightVideoFromGallery,
  openSelectedVideo,
  applyQuizAnswered,
  applyQuizTimeout,
  applyNoisePenaltyOnQuiz,
  saveTeamNameOrWarn,
} from "../src/core/actions.js";
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
  endGameAndGoHome: (ctx) => endGameAndReset(ctx),
  goTutorial: ({ goTo }) => goTo("tutorial"),
  goGallery: (ctx) => {
    ctx.state.gallerySeed = (Math.random() * 0x7fffffff) | 0;
    ctx.state.galleryEpoch = Date.now();
    ctx.goTo("gallery");
  },
  goQuiz: (ctx) => startQuietThenQuiz(ctx),
  goQuizNow: ({ goTo }) => goTo("quiz"),
  goVideo: ({ goTo }) => goTo("video"),
  goLeaderboard: ({ goTo }) => goTo("leaderboard"),
  videoEndedAdvance: ({ actions: a, ...ctx }) => a.goQuiz(ctx),
  advanceFromAttention: (ctx) => advanceFromAttentionToVideo(ctx),
  advanceFromQuiet: (ctx) => advanceFromQuietToQuiz(ctx),
  connectArduino: (ctx) => connectArduino(ctx),
  saveTeamName: (ctx) => saveTeamNameOrWarn(ctx),
  pointsPerCorrect: POINTS_PER_CORRECT,
  quizAnswered: (ctx) => applyQuizAnswered(ctx, { pointsPerCorrect: POINTS_PER_CORRECT }),
  quizTimeout: (ctx) => applyQuizTimeout(ctx),
  noisePenalty: (ctx) => applyNoisePenaltyOnQuiz(ctx, POINTS_NOISE_PENALTY),
  openVideoFromGallery: (ctx) => openVideoFromGalleryWithPayload(ctx),
  loadSpotlightVideoFromGallery: (ctx) => loadSpotlightVideoFromGallery(ctx),
  openSelectedVideo: (ctx) => openSelectedVideo(ctx),
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
  templateInputSubmit: (ctx) => {
    const value = ctx.ui.getInputValue("templateInput");
    console.info(value ? `Enviado: ${value}` : "Escreve algo primeiro.");
  },
};
