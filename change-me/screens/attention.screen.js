import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";
import { serial } from "../../src/serial.js";

let hearingImagePreloaded = false;
let p2VideoSkipKeyHandler = null;
let p2VideoSkipSerialUnsub = null;
let attentionEnterAdvanceHandler = null;

export let attentionScreen = new Screen("attention");

attentionScreen.setLayout({ gap: 0, vAlign: "top", variant: "display" });

attentionScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

attentionScreen.addText({ text: "Fica atento", variant: "title", vAlign: "top", marginTop: "10.65vh" });

attentionScreen.addMountStep(({ ui }) => {
  if (document.body.dataset.role === "p1") return;
  ui.beginShadowBox({ dock: "bottom-right" });
  ui.setCornerHint({
    html:
      'PRIME:<br><span class="ui-corner-hint-dot ui-corner-hint-dot--white" aria-hidden="true">⬤</span> PARA CONTINUAR',
    ariaLabel: "Prima o botão branco para continuar",
    className: "ui-corner-hint-badge--wide",
    inline: true,
  });
  ui.endShadowBox();
});

attentionScreen.beginFlexRow({
  gap: 0,
  hGap: 0,
  align: "stretch",
});

attentionScreen.beginFlexSection({ align: "center", flex: 4 });
attentionScreen.addMountStep(({ ui, payload }) => {
  const isP1 = document.body.dataset.role === "p1";
  const p2DuringVideo = !isP1 && payload?.p2VideoListen;
  ui.addImage({
    filename: p2DuringVideo ? "hearing.png" : "attention.png",
    size: 50,
    slotAspectRatio: "1 / 1",
    align: "center",
  });
});
attentionScreen.endFlexSection();

attentionScreen.beginFlexSection({
  align: "left",
  flex: 6,
  justify: "center",
  paddingRight: "5%",
});

attentionScreen.addMountStep(({ ui }) => {
  const isP1 = document.body.dataset.role === "p1";
  const instructionsFontSize = "clamp(22px, 2.6vw, 36px)";
  ui.addText(
    isP1
      ? {
          text: "o vídeo começará dentro de momentos, descreve-o em muito detalhe ao **Player 2**",
          variant: "body",
          fontSize: instructionsFontSize,
        }
      : {
          text: "Ouve com muita atenção a descrição do **Player 1**.",
          variant: "body",
          fontSize: instructionsFontSize,
        }
  );
});
attentionScreen.endFlexSection();
attentionScreen.endFlexRow();

attentionScreen.onEnter(({ ui, state, payload }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);

  if (!hearingImagePreloaded) {
    hearingImagePreloaded = true;
    const pre = new Image();
    pre.src = "/assets/images/hearing.png";
  }
  const p2DuringVideo = document.body.dataset.role !== "p1" && payload?.p2VideoListen;
  if (p2DuringVideo) {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      ui.runAction("videoEndedAdvance");
    };
    p2VideoSkipKeyHandler = (e) => {
      if (e.repeat) return;
      if (e.key === "Tab") return;
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      go();
    };
    window.addEventListener("keydown", p2VideoSkipKeyHandler);
    p2VideoSkipSerialUnsub = serial.onButtonPress(() => go());
    return;
  }
  ui.addCountdownTimer({
    seconds: 5,
    label: "Tempo",
    showZero: false,
  });
  attentionEnterAdvanceHandler = (e) => {
    if (e.key !== "Enter") return;
    if (e.repeat) return;
    ui.runAction("advanceFromAttention");
  };
  window.addEventListener("keydown", attentionEnterAdvanceHandler);
});

attentionScreen.onExit(() => {
  if (p2VideoSkipKeyHandler) {
    window.removeEventListener("keydown", p2VideoSkipKeyHandler);
    p2VideoSkipKeyHandler = null;
  }
  if (p2VideoSkipSerialUnsub) {
    p2VideoSkipSerialUnsub();
    p2VideoSkipSerialUnsub = null;
  }
  if (attentionEnterAdvanceHandler) {
    window.removeEventListener("keydown", attentionEnterAdvanceHandler);
    attentionEnterAdvanceHandler = null;
  }
});
