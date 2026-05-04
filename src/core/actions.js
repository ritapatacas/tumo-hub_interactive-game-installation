import { persistStateTeam, applyNoisePenalty, showNoisePenalty } from "./team.js";
import { selectVideoFromPayload } from "./video.js";
import { resolveGalleryItems } from "./gallery.js";
import { serial } from "../serial.js";
import { answerIsCorrect, recordAnswer, addTeamPoints } from "./pointsHelpers.js";

export const QUIZ_FEEDBACK_DOCK_MS = 9000;


function clearAttentionTimer(state) {
  if (state.__attentionTimerId) {
    clearTimeout(state.__attentionTimerId);
    state.__attentionTimerId = null;
  }
}

function clearQuietTimer(state) {
  if (state.__quietTimerId) {
    clearTimeout(state.__quietTimerId);
    state.__quietTimerId = null;
  }
}

export function openVideoFromGalleryWithPayload(ctx) {
  selectVideoFromPayload(ctx);
  clearAttentionTimer(ctx.state);
  ctx.goTo("attention");
  ctx.state.__attentionTimerId = setTimeout(() => {
    ctx.goTo("video");
    ctx.state.__attentionTimerId = null;
  }, 5000);
}

export function advanceFromAttentionToVideo(ctx) {
  clearAttentionTimer(ctx.state);
  ctx.goTo("video");
}

export function advanceFromQuietToQuiz(ctx) {
  clearQuietTimer(ctx.state);
  ctx.goTo("quiz");
}

export function startQuietThenQuiz(ctx) {
  clearQuietTimer(ctx.state);
  ctx.goTo("quiet");
  ctx.state.__quietTimerId = setTimeout(() => {
    ctx.goTo("quiz");
    ctx.state.__quietTimerId = null;
  }, 10000);
}

export function endGameAndReset(ctx) {
  const s = ctx.state;
  clearAttentionTimer(s);
  clearQuietTimer(s);
  s.teamName = "";
  s.teamCode = "";
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
}

export async function connectArduino(ctx) {
  if (!serial.isSupported()) {
    ctx.ui.showMessage("Serial não disponível neste browser (usa Chrome/Edge).", { type: "error" });
    return;
  }
  try {
    await serial.connect({ baudRate: 9600 });
    console.info("Arduino ligado. Os botões controlam as opções do quiz.");
  } catch (e) {
    ctx.ui.showMessage(e?.message || "Erro ao ligar Arduino.", { type: "error" });
  }
}

export function loadSpotlightVideoFromGallery(ctx) {
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
}

export function openSelectedVideo(ctx) {
  const id = ctx.state.selectedVideoId;
  const items = ctx.state.videosData ?? [];
  const item = items.find((v) => v.id === id);
  if (!item) {
    console.info("Escolhe um vídeo na galeria primeiro.");
    return;
  }
  ctx.actions.openVideoFromGallery({ ...ctx, payload: item });
}

export function buildQuizAnswerOutcome(ctx, { pointsPerCorrect = 10 } = {}) {
  const info = recordAnswer(ctx);
  const isRight = answerIsCorrect(info.answer);
  let roundPoints;
  if (isRight) {
    roundPoints = pointsPerCorrect;
    if (info.hadWrongBefore) roundPoints -= 2;
  } else {
    roundPoints = -1;
  }
  addTeamPoints(ctx, roundPoints);
  if (isRight) {
    const html = info.hadWrongBefore
      ? `CORRETO!<br>+${roundPoints} pts<br>(tinhas errado antes)`
      : `CORRETO!<br>+${roundPoints} pts`;
    const ariaLabel = info.hadWrongBefore
      ? `Correto. Mais ${roundPoints} pontos. Tinhas errado antes.`
      : `Correto. Mais ${roundPoints} pontos.`;
    return {
      quizFeedbackDock: {
        html,
        ariaLabel,
        boxClassName: "ui-shadow-box--docked-success",
        duration: QUIZ_FEEDBACK_DOCK_MS,
      },
    };
  }
  const ariaLabel = info.hadWrongBefore
    ? "Resposta errada novamente. Menos 1 ponto."
    : "Resposta errada. Menos 1 ponto.";
  const html = info.hadWrongBefore ? `RESPOSTA ERRADA!<br>-1 pt<br>(novamente)` : `RESPOSTA ERRADA!<br>-1 pt`;
  return {
    quizFeedbackDock: {
      html,
      ariaLabel,
      boxClassName: "ui-shadow-box--docked-error",
      duration: QUIZ_FEEDBACK_DOCK_MS,
    },
  };
}

export function applyQuizAnswered(ctx, opts) {
  const { quizFeedbackDock } = buildQuizAnswerOutcome(ctx, opts);
  ctx.state.pendingQuizFeedbackDock = quizFeedbackDock ?? null;
  ctx.state.gallerySeed = (Math.random() * 0x7fffffff) | 0;
  ctx.state.galleryEpoch = Date.now();
  ctx.goTo("leaderboard");
}

export function applyQuizTimeout(ctx) {
  ctx.ui.showMessage("Tempo esgotado. 0 pontos.", { type: "error" });
  ctx.state.gallerySeed = (Math.random() * 0x7fffffff) | 0;
  ctx.state.galleryEpoch = Date.now();
  ctx.goTo("gallery");
}

export function applyNoisePenaltyOnQuiz(ctx, penalty) {
  if (ctx.screen !== "quiz") return;
  const team = applyNoisePenalty(ctx, penalty);
  showNoisePenalty(ctx, team, penalty);
}

export function saveTeamNameOrWarn(ctx) {
  const result = persistStateTeam(ctx);
  if (!result?.ok) {
    if (result?.reason === "code-not-found") {
      ctx.ui.showMessage("", {
        dock: "top-left",
        boxClassName: "ui-shadow-box--docked-error",
        html: `CÓDIGO NÃO ENCONTRADO!<br>${result.code}`,
        ariaLabel: `Código ${result.code} não encontrado.`,
        duration: 5000,
      });
      return;
    }
    ctx.ui.showMessage("", {
      dock: "top-left",
      boxClassName: "ui-shadow-box--docked-error",
      html: "ESCREVE O NOME DA EQUIPA!",
      ariaLabel: "Escreve o nome da equipa.",
      duration: 5000,
    });
    return;
  }
  ctx.ui.showMessage("", {
    dock: "top-left",
    html: `CÓDIGO DA EQUIPA<br>${result.record.code}`,
    ariaLabel: `Código da equipa ${result.record.code}.`,
    duration: 5000,
  });
  ctx.goTo("tutorial");
}
