import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

function applyAttentionCountdownSizing(ui) {
  const countdown = ui._countdownEl;
  if (!countdown) return;
  const labelEl = countdown.querySelector(".ui-quiz-countdown-label");
  const valueEl = countdown.querySelector(".ui-quiz-countdown-value");
  if (labelEl) labelEl.style.fontSize = "15px";
  if (valueEl) valueEl.style.fontSize = "clamp(32px, 5.8vw, 46px)";
}

export let quietScreen = new Screen("quiet");

quietScreen.setLayout({
  gap: 0,
  vAlign: "top",
  variant: "display",
  marginTop: "25vh",
  maxContentHeight: "min(56vh, 100%)",
  maxWidth: "62vw",
});

quietScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

quietScreen.addText({
  text: "Chiu!",
  variant: "title",
  fontSize: "clamp(46px, 6.5vw, 78px)",
  vAlign: "top",
  marginTop: "clamp(5px, 2vh, 20px)",
  marginBottom: "clamp(10px, 3.5vh, 30px)",
});

quietScreen.addCornerHint({
  p1Only: true,
  buttons: [{ color: "white", label: "CONTINUAR" }],
  ariaLabel: "Prima o botão branco para continuar",
});

quietScreen.beginFlexRow({
  gap: 0,
  hGap: 0,
  align: "stretch",
  justify: "flex-start",
  className: "ui-flex-row--quiet-body",
});

quietScreen.beginFlexSection({ align: "center", flex: 3, gap: 0, marginRight: 0 });
quietScreen.addImage({
  filename: "quiet.png",
  size: 42,
  slotAspectRatio: "1 / 1",
  align: "center",
});
quietScreen.endFlexSection();

quietScreen.beginFlexSection({
  align: "left",
  flex: 5,
  gap: 0,
  justify: "flex-start",
  minWidth: "0",
});

quietScreen.addMountStep(({ ui, payload, isP2, state }) => {
  const bodyFontSize = "clamp(26px, 3vw, 36px)";
  if (isP2 && payload?.p2WhileP1Quiz) {
    ui.addText({
      text: "O Player 1 está a responder ao quiz.",
      variant: "body",
      fontSize: bodyFontSize,
      marginTop: 24,
      marginRight: 60,
    });
  } else if (isP2) {
    ui.addText({
      text: "Já não vão poder falar!\nSe forem apanhados serão descontados pontos!",
      variant: "body",
      fontSize: bodyFontSize,
      marginTop: 24,
      marginRight: 60,
    });
  } else {
    ui.addText({
      text: "Já não vão poder falar!\nSe forem apanhados serão descontados pontos!\n\nTens 10 segundos para responder à pergunta.",
      variant: "body",
      fontSize: bodyFontSize,
      marginTop: 24,
      marginRight: 60,
    });
  }
});
quietScreen.endFlexSection();

quietScreen.addMountStep(({ ui, payload, isP2, state }) => {
  if (!isP2) return;
  ui.beginFlexSection({
    align: "left",
    flex: false,
    className: "ui-flex-section--quiet-p2-slot",
    minWidth: 72,
    marginLeft: -60,
    marginTop: -32,
  });
  const quiz = Boolean(payload?.p2WhileP1Quiz);
  if (quiz) {
    ui.addCountdownTimer({
      seconds: 10,
      label: "Tempo",
      onCompleteAction: "",
      showZero: true,
    });
    applyAttentionCountdownSizing(ui);
    ui.addNoiseLevel({
      threshold: 0.5,
      sensitivity: 2,
      onLevelChange: ({ localLevel }) => {
        state.publishRoleNoiseLevel?.(localLevel);
      },
    });
  } else {
    ui.addNoiseLevelShell();
  }
  ui.endFlexSection();
});

quietScreen.endFlexRow();

quietScreen.onKeyDown("Enter", "advanceFromQuiet", {
  when: (c) => !(c.isP2 && c.payload?.p2WhileP1Quiz),
});

quietScreen.onEnter(({ ui, state, payload, isP2 }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
  if (state.__p2QuizAnsweredWatchId) {
    clearInterval(state.__p2QuizAnsweredWatchId);
    state.__p2QuizAnsweredWatchId = null;
  }
  if (isP2 && payload?.p2WhileP1Quiz) {
    state.__p2QuizAnsweredWatchId = setInterval(() => {
      if (!state.pendingQuizFeedbackDock) return;
      clearInterval(state.__p2QuizAnsweredWatchId);
      state.__p2QuizAnsweredWatchId = null;
      state.forceVisibleScreen?.("leaderboard");
    }, 150);
    return;
  }
  ui.addCountdownTimer({
    seconds: 10,
    label: "Tempo",
    showZero: false,
    dangerAlways: true,
  });
  applyAttentionCountdownSizing(ui);
  if (ui._countdownEl) {
    ui._countdownEl.style.marginTop = "auto";
    ui._countdownEl.style.marginBottom = "70px";
  }
});

quietScreen.onExit(({ state }) => {
  if (!state.__p2QuizAnsweredWatchId) return;
  clearInterval(state.__p2QuizAnsweredWatchId);
  state.__p2QuizAnsweredWatchId = null;
});
