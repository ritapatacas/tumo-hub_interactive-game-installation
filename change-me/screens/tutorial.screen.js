import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";
import { bindTutorialContinueKey } from "../../src/core/screenBindings.js";

const tutStepText = {
  variant: "hand",
  fontSize: "clamp(12px, 2.4vw, 26px)",
  paragraphGap: 9,
};

export let tutorialScreen = new Screen("tutorial");

tutorialScreen.setLayout({ gap: 0, maxWidth: 490, vAlign: "top", marginTop: "25vh" });
tutorialScreen.setBackgroundImage({
  filename: "bg-06.png",
  size: "cover",
  position: "center center",
});

tutorialScreen.addCornerHint({
  p2Only: true,
  buttons: [{ color: "white", label: "PARA CONTINUAR" }],
  ariaLabel: "Prima o botão branco ou a tecla Enter para ir à galeria",
});

tutorialScreen.addMountStep(({ ui, isP1 }) => {
  if (isP1) ui.setCornerHint({ text: "" });
});

tutorialScreen.beginFlexRow({
  gap: 32,
  hGap: 340,
  align: "left",
});
tutorialScreen.addText({
  text: "Como jogar?",
  variant: "title",
  align: "top",
  color: "var(--ink)",
  marginTop: -20,
  marginBottom: 50,
});

tutorialScreen.beginFlexSection({ align: "left", gap: 14, marginTop: -20 });

const tutIcon = {
  size: 18,
  slotAspectRatio: "1 / 1",
  objectFit: "contain",
};

const tutIconTopTight = {
  ...tutIcon,
  marginTop: "calc(-0.42em - 6px)",
};

tutorialScreen.addText({
  text: "**Player 1** vai para o outro lado da sala e escolhe o vídeo da ronda.",
  leadingImage: { filename: "walk.png", ...tutIconTopTight },
  ...tutStepText,
});
tutorialScreen.addText({
  text: "**Player 1** vê o vídeo e descreve tudo ao **Player 2**.",
  leadingImage: { filename: "talk.png", ...tutIcon },
  ...tutStepText,
});
tutorialScreen.addText({
  text: "**Player 2** responde à pergunta com base no que o **Player 1** disse.",
  leadingImage: { filename: "hearing.png", ...tutIcon },
  ...tutStepText,
});
tutorialScreen.addText({
  text: "…sem fazer barulho.",
  leadingImage: { filename: "quiet.png", ...tutIcon, size: 13 },
  ...tutStepText,
});

tutorialScreen.endFlexSection();
tutorialScreen.endFlexRow();

tutorialScreen.addBinding((ctx) => (ctx.isP2 ? bindTutorialContinueKey(ctx) : () => {}));

tutorialScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
});
