import { Screen } from "../../src/core/Screen.js";
import { answerIsCorrect, recordAnswer, addTeamPoints } from "../../src/core/pointsHelpers.js";

/** Duração da mensagem dock (certo/errado) no leaderboard. */
export const QUIZ_FEEDBACK_DOCK_MS = 9000;

export let quizScreen = new Screen("quiz");


quizScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center bottom",
});

quizScreen.useDefaultQuiz({
  onAnswerAction: "quizAnswered",
  noiseAction: "noisePenalty",
  backAction: "goGallery",
  backLabel: "Voltar",
  sensitivity: 2,
  // Apresentação das opções: "list" (vertical) ou "grid" (2x2)
  optionsLayout: "list",
});

/**
 * Não mostra UI aqui (o clear do próximo ecrã apagava a caixa). Devolve dados para o leaderboard.
 * @returns {{ quizFeedbackDock: { html: string, boxClassName: string, ariaLabel: string, duration: number } }}
 */
export function onQuizAnswered(ctx) {
  const info = recordAnswer(ctx);
  let isRight = answerIsCorrect(info.answer);

  let roundPoints;

  if (isRight) {
    roundPoints = 10;
    if (info.hadWrongBefore) {
      roundPoints -= 2;
    }
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
  const html = info.hadWrongBefore
    ? `RESPOSTA ERRADA!<br>-1 pt<br>(novamente)`
    : `RESPOSTA ERRADA!<br>-1 pt`;
  return {
    quizFeedbackDock: {
      html,
      ariaLabel,
      boxClassName: "ui-shadow-box--docked-error",
      duration: QUIZ_FEEDBACK_DOCK_MS,
    },
  };
}
