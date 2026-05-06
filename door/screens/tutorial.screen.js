import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

const tutStepText = {
  variant: "hand",
  fontSize: "clamp(18px, 3.1vw, 35px)",
  paragraphGap: 14,
};

export const doorTutorialScreen = new Screen("door-tutorial");

doorTutorialScreen.setLayout({ gap: 0, maxWidth: 590, vAlign: "top", marginTop: "25vh" });
doorTutorialScreen.setBackgroundImage({
  filename: "bg-06.png",
  size: "cover",
  position: "center center",
});

doorTutorialScreen.addCornerHint({
  p1Only: true,
  buttons: [{ color: "white", label: "PARA CONTINUAR" }],
  ariaLabel: "Prima o botão branco ou a tecla Enter para continuar",
});

doorTutorialScreen.addMountStep(({ ui, isP2 }) => {
  if (isP2) ui.setCornerHint({ text: "" });
});

doorTutorialScreen.beginFlexRow({
  gap: 32,
  hGap: 340,
  align: "left",
});
doorTutorialScreen.addText({
  text: "Como jogar?",
  variant: "title",
  fontSize: "clamp(36px, 5.5vw, 64px)",
  align: "top",
  color: "var(--ink)",
  marginTop: -28,
  marginBottom: 50,
});

doorTutorialScreen.beginFlexSection({ align: "left", gap: 22, marginTop: -20 });

const tutIcon = {
  size: 20,
  slotAspectRatio: "1 / 1",
  objectFit: "contain",
};

const tutIconTopTight = {
  ...tutIcon,
  marginTop: "calc(-0.1em - 6px)",
};

doorTutorialScreen.addText({
  text: "**Player 2** vai para o outro lado da sala e escolhe o vídeo da ronda.",
  leadingImage: { filename: "walk.png", ...tutIconTopTight },
  ...tutStepText,
});
doorTutorialScreen.addText({
  text: "**Player 2** vê o vídeo e descreve tudo ao **Player 1**.",
  leadingImage: { filename: "talk.png", ...tutIcon },
  marginTop: 16,
  ...tutStepText,
});
doorTutorialScreen.addText({
  text: "**Player 1** responde à pergunta com base no que o **Player 2** disse.",
  leadingImage: { filename: "hearing.png", ...tutIcon },
  ...tutStepText,
});
doorTutorialScreen.addText({
  text: "…sem fazer barulho.",
  leadingImage: { filename: "quiet.png", ...tutIcon, size: 15, marginLeft: 18 },
  marginLeft: 12,
  marginTop: 16,
  ...tutStepText,
});

doorTutorialScreen.endFlexSection();
doorTutorialScreen.endFlexRow();

doorTutorialScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
});
