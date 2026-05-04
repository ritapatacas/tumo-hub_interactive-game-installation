import { Screen } from "../../src/core/Screen.js";

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
  optionsLayout: "list",
});
