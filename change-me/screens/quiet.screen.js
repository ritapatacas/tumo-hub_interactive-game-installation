import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

let quietEnterAdvanceHandler = null;

export let quietScreen = new Screen("quiet");

quietScreen.setLayout({
  gap: 0,
  vAlign: "top",
  variant: "display",
  marginTop: "25vh",
  maxContentHeight: "min(56vh, 100%)",
});

quietScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

quietScreen.addText({
  text: "Chiu!",
  variant: "title",
  vAlign: "top",
  marginTop: "clamp(20px, 3.5vh, 40px)",
});

quietScreen.addMountStep(({ ui }) => {
  if (document.body.dataset.role === "p1") return;
    ui.beginShadowBox({ dock: "bottom-left", radius: "3px" });
  ui.setCornerHint({
    html:
      'PRIME:<br><span class="ui-corner-hint-dot ui-corner-hint-dot--white" aria-hidden="true">⬤</span> CONTINUAR',
    ariaLabel: "Prima o botão branco para continuar",
    className: "ui-corner-hint-badge--wide",
    inline: true,
  });
  ui.endShadowBox();
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
  size: 50,
  slotAspectRatio: "1 / 1",
  align: "center",
});
quietScreen.endFlexSection();

quietScreen.beginFlexSection({
  align: "left",
  flex: 5,
  gap: 0,
  justify: "flex-start",
});

quietScreen.addMountStep(({ ui, payload }) => {
  const isP1 = document.body.dataset.role === "p1";
  const bodyFontSize = "clamp(22px, 2.6vw, 36px)";
  if (isP1 && payload?.p1WhileP2Quiz) {
    ui.addText({
      text: "O Player 2 está a responder ao quiz.",
      variant: "body",
      fontSize: bodyFontSize,
      marginTop: 12,
    });
  } else if (isP1) {
    ui.addText({
      text: "Já não vão poder falar!\nSe forem apanhados serão descontados pontos!",
      variant: "body",
      fontSize: bodyFontSize,
      marginTop: 12,
    });
  } else {
    ui.addText({
      text: "Já não vão poder falar!\nSe forem apanhados serão descontados pontos!\n\nTens 10 segundos para responder à pergunta.",
      variant: "body",
      fontSize: bodyFontSize,
      marginTop: 12,
    });
  }
});
quietScreen.endFlexSection();

quietScreen.addMountStep(({ ui, payload }) => {
  if (document.body.dataset.role !== "p1") return;
  ui.beginFlexSection({
    align: "left",
    flex: false,
    className: "ui-flex-section--quiet-p1-slot",
    minWidth: 72,
    marginLeft: -60,
    marginTop: -32,
  });
  const quiz = Boolean(payload?.p1WhileP2Quiz);
  if (quiz) {
    ui.addCountdownTimer({
      seconds: 10,
      label: "Tempo",
      onCompleteAction: "",
      showZero: true,
    });
    ui.addNoiseLevel({
      threshold: 0.5,
      sensitivity: 2,
    });
  } else {
    /* Contador em onEnter por baixo do texto (igual ao P2); aqui só reserva da barra */
    ui.addNoiseLevelShell();
  }
  ui.endFlexSection();
});

quietScreen.endFlexRow();

quietScreen.onEnter(({ ui, state, payload }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);

  const isP1 = document.body.dataset.role === "p1";
  if (isP1 && payload?.p1WhileP2Quiz) {
    return;
  }
  if (isP1) {
    ui.addCountdownTimer({
      seconds: 10,
      label: "Tempo",
      showZero: false,
      dangerAlways: true,
    });
    quietEnterAdvanceHandler = (e) => {
      if (e.key !== "Enter") return;
      if (e.repeat) return;
      ui.runAction("advanceFromQuiet");
    };
    window.addEventListener("keydown", quietEnterAdvanceHandler);
    return;
  }

  ui.addCountdownTimer({
    seconds: 10,
    label: "Tempo",
    showZero: false,
    dangerAlways: true,
  });
  quietEnterAdvanceHandler = (e) => {
    if (e.key !== "Enter") return;
    if (e.repeat) return;
    ui.runAction("advanceFromQuiet");
  };
  window.addEventListener("keydown", quietEnterAdvanceHandler);
});

quietScreen.onExit(() => {
  if (quietEnterAdvanceHandler) {
    window.removeEventListener("keydown", quietEnterAdvanceHandler);
    quietEnterAdvanceHandler = null;
  }
});
