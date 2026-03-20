import { Screen } from "../../src/core/Screen.js";
import { answerIsCorrect, recordAnswer, addTeamPoints } from "../../src/core/pointsHelpers.js";

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

export function onQuizAnswered(ctx) {
  const info = recordAnswer(ctx);
  let isRight = answerIsCorrect(info.answer);

  let msg;
  let roundPoints;

  if (isRight) {
    roundPoints = 10;
    if (info.hadWrongBefore) {
      roundPoints -= 2;
      msg = "Correto! +" + roundPoints + " pontos (tinhas errado antes).";
    } else {
      msg = "Correto! +" + roundPoints + " pontos.";
    }
  } else {
    roundPoints = -1;
    if (info.hadWrongBefore) {
      msg = "Resposta errada novamente. -1 ponto.";
    } else {
      msg = "Resposta errada. -1 ponto.";
    }
  }

  addTeamPoints(ctx, roundPoints);
  ctx.ui.showMessage(msg, { type: isRight ? "success" : "error" });
}
