import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";
import { bindAttentionInput } from "../../src/core/screenBindings.js";

export let attentionScreen = new Screen("attention");

attentionScreen.setLayout({ gap: 0, vAlign: "top", variant: "display" });
attentionScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

attentionScreen.addText({ text: "Fica atento", variant: "title", vAlign: "top", marginTop: "10.65vh" });

attentionScreen.addCornerHint({
  p2Only: true,
  buttons: [{ color: "white", label: "CONTINUAR" }],
  ariaLabel: "Prima o botão branco para continuar",
});

attentionScreen.beginFlexRow({
  gap: 0,
  hGap: 0,
  align: "stretch",
});

attentionScreen.beginFlexSection({ align: "center", flex: 4 });
attentionScreen.addMountStep(({ ui, payload, isP1 }) => {
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

attentionScreen.addMountStep(({ ui, isP1 }) => {
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

attentionScreen.addBinding(bindAttentionInput);

attentionScreen.onEnter(({ ui, state, payload, isP2 }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
  if (isP2 && payload?.p2VideoListen) return;
  ui.addCountdownTimer({
    seconds: 5,
    label: "Tempo",
    showZero: false,
  });
});
