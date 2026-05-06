import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";
import { bindTutorialContinueKey } from "../../src/core/screenBindings.js";

const tutStepText = {
  variant: "hand",
  fontSize: "clamp(18px, 3.1vw, 35px)",
  paragraphGap: 14,
};

export let tutorialScreen = new Screen("tutorial");

tutorialScreen.setLayout({ gap: 0, maxWidth: 600, vAlign: "top", marginTop: "25vh" });
tutorialScreen.setBackgroundImage({
  filename: "bg-06.png",
  size: "cover",
  position: "center center",
});

tutorialScreen.addCornerHint({
  p1Only: true,
  buttons: [{ color: "white", label: "PARA CONTINUAR" }],
  ariaLabel: "Prima o botão branco ou a tecla Enter para ir à galeria",
});

tutorialScreen.addMountStep(({ ui, isP2 }) => {
  if (isP2) ui.setCornerHint({ text: "" });
});

tutorialScreen.beginFlexRow({
  gap: 42,
  hGap: 340,
  align: "left",
});
tutorialScreen.addText({
  text: "Como jogar?",
  variant: "title",
  fontSize: "clamp(36px, 5.5vw, 64px)",
  align: "top",
  color: "var(--ink)",
  marginTop: -60,
  marginBottom: 50,
});

tutorialScreen.beginFlexSection({ align: "left", gap: 22, marginTop: -50 });

const tutIcon = {
  size: 20,
  slotAspectRatio: "1 / 1",
  objectFit: "contain",
};

const tutIconTopTight = {
  ...tutIcon,
  marginTop: "calc(-0.10em - 20px)",
};

tutorialScreen.addText({
  text: "**Player 2** vai para o outro lado da sala.",
  leadingImage: { filename: "walk.png", ...tutIconTopTight },
  ...tutStepText,
});

tutorialScreen.addText({
  text: "**Player 1** escolhe o vídeo da ronda.",
  leadingImage: { filename: "manual.png", ...tutIconTopTight },
  ...tutStepText,
});

tutorialScreen.addText({
  text: "**Player 2** vê o vídeo e descreve tudo ao **Player 1**.",
  leadingImage: { filename: "talk.png", ...tutIcon },
  marginTop: 16,
  ...tutStepText,
});
tutorialScreen.addText({
  text: "**Player 1** responde à pergunta com base no que o **Player 2** disse.",
  leadingImage: { filename: "hearing.png", ...tutIcon },
  ...tutStepText,
});
tutorialScreen.addText({
  text: "…sem fazer barulho.",
  leadingImage: { filename: "quiet.png", ...tutIcon, size: 15, marginLeft: 18 },
  marginLeft: 12,
  marginTop: 16,
  ...tutStepText,
});

tutorialScreen.endFlexSection();
tutorialScreen.endFlexRow();

tutorialScreen.addBinding((ctx) => (ctx.isP1 ? bindTutorialContinueKey(ctx) : () => {}));

tutorialScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
});
