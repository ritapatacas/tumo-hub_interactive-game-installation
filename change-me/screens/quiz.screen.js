import { Screen } from "../../src/core/Screen.js";
import { answerIsCorrect, recordAnswer, addTeamPoints } from "../../src/core/pointsHelpers.js";

export let quizScreen = new Screen("quiz");

quizScreen.addText({ text: "Quiz", variant: "title" });

quizScreen.useDefaultQuiz({
  onAnswerAction: "quizAnswered",
  noiseAction: "noisePenalty",
  backAction: "goGallery",
  backLabel: "Voltar",
  sensitivity: 1,
  // Apresentação das opções: "list" (vertical) ou "grid" (2x2)
  optionsLayout: "grid",
});

export function onQuizAnswered(ctx) {
  const info = recordAnswer(ctx);
  let isRight = answerIsCorrect(info.answer);

  let history = {
    hadWrongBefore: recordAnswer(ctx).hadWrongBefore,
    attemptsTotal: recordAnswer(ctx).attemptsTotal,
    wrongAnswerTotal: recordAnswer(ctx).wrongAnswerTotal,
  }

  let msg;
  let roundPoints;

  if (isRight) {
    roundPoints;

    if (history.hadWrongBefore) {
    }
    
  } else {

    if (history.hadWrongBefore) {
    }
  }

  addTeamPoints(ctx, roundPoints);
  ctx.ui.showMessage(msg, { type: "error" });
}
