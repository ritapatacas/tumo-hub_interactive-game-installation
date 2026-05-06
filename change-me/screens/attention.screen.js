import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";
import { bindAttentionInput } from "../../src/core/screenBindings.js";

export let attentionScreen = new Screen("attention");

attentionScreen.setLayout({
  gap: 0,
  vAlign: "top",
  variant: "display",
  marginTop: "25vh",
  maxContentHeight: "min(56vh, 100%)",
  maxWidth: "60vw",
});
attentionScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

attentionScreen.addText({
  text: "Fica atento",
  variant: "title",
  fontSize: "clamp(46px, 6.5vw, 78px)",
  vAlign: "top",
  marginTop: "clamp(5px, 2vh, 20px)",
  marginBottom: "clamp(10px, 3.5vh, 30px)",
});

attentionScreen.addCornerHint({
  p1Only: true,
  buttons: [{ color: "white", label: "CONTINUAR" }],
  ariaLabel: "Prima o botão branco para continuar",
});

attentionScreen.beginFlexRow({
  gap: 0,
  hGap: 0,
  align: "stretch",
  justify: "flex-start",
  className: "ui-flex-row--attention-body",
});

attentionScreen.beginFlexSection({ align: "center", flex: 3, gap: 0, marginRight: 0 });
attentionScreen.addMountStep(({ ui, payload, isP2 }) => {
  const p1DuringVideo = !isP2 && payload?.p1VideoListen;
  ui.addImage({
    filename: p1DuringVideo ? "hearing.png" : "attention.png",
    size: 70,
    slotAspectRatio: "1 / 1",
    align: "center",
  });
});
attentionScreen.endFlexSection();

attentionScreen.beginFlexSection({
  align: "left",
  flex: 5,
  gap: 0,
  justify: "flex-start",
  minWidth: "0",
});

attentionScreen.addMountStep(({ ui, isP2 }) => {
  const instructionsFontSize = "clamp(26px, 3vw, 36px)";
  ui.addText(
    isP2
      ? {
          text: "o vídeo começará dentro de momentos, descreve-o em muito detalhe ao **Player 1**",
          variant: "body",
          fontSize: instructionsFontSize,
          marginTop: 24,
          marginRight: 60,

        }
      : {
          text: "Ouve com muita atenção a descrição do **Player 2**. \n\nPodes fazer perguntas, mas não podes ver o vídeo!",
          variant: "body",
          fontSize: instructionsFontSize,
          marginTop: 24,
          marginRight: 60,
        }
  );
});
attentionScreen.endFlexSection();
attentionScreen.endFlexRow();

attentionScreen.addBinding(bindAttentionInput);

attentionScreen.onEnter(({ ui, state, payload, isP1 }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
  if (isP1 && payload?.p1VideoListen) return;
  ui.addCountdownTimer({
    seconds: 5,
    label: "Tempo",
    showZero: false,
  });
  const countdown = ui._countdownEl;
  if (countdown) {
    countdown.style.marginTop = "auto";
    countdown.style.marginBottom = "70px";
    const labelEl = countdown.querySelector(".ui-quiz-countdown-label");
    const valueEl = countdown.querySelector(".ui-quiz-countdown-value");
    if (labelEl) labelEl.style.fontSize = "15px";
    if (valueEl) valueEl.style.fontSize = "clamp(32px, 5.8vw, 46px)";
  }
});
