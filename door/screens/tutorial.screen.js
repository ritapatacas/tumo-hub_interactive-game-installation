import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

const tutStepText = {
  variant: "hand",
  fontSize: "clamp(12px, 2.4vw, 26px)",
  paragraphGap: 9,
};

export const doorTutorialScreen = new Screen("door-tutorial");

doorTutorialScreen.setLayout({ gap: 0, maxWidth: 490, vAlign: "top", marginTop: "25vh" });
doorTutorialScreen.setBackgroundImage({
  filename: "bg-06.png",
  size: "cover",
  position: "center center",
});

doorTutorialScreen.beginFlexRow({
  gap: 32,
  hGap: 340,
  align: "left",
});
doorTutorialScreen.addText({
  text: "Como jogar?",
  variant: "title",
  align: "top",
  color: "var(--ink)",
  marginTop: -20,
  marginBottom: 50,
});

doorTutorialScreen.beginFlexSection({ align: "left", gap: 14, marginTop: -20 });

const tutIcon = {
  size: 18,
  slotAspectRatio: "1 / 1",
  objectFit: "contain",
};

const tutIconTopTight = {
  ...tutIcon,
  marginTop: "calc(-0.42em - 6px)",
};

doorTutorialScreen.addText({
  text: "**Player 1** vai para o outro lado da sala e escolhe o vídeo da ronda.",
  leadingImage: { filename: "walk.png", ...tutIconTopTight },
  ...tutStepText,
});
doorTutorialScreen.addText({
  text: "**Player 1** vê o vídeo e descreve tudo ao **Player 2**.",
  leadingImage: { filename: "talk.png", ...tutIcon },
  ...tutStepText,
});
doorTutorialScreen.addText({
  text: "**Player 2** responde à pergunta com base no que o **Player 1** disse.",
  leadingImage: { filename: "hearing.png", ...tutIcon },
  ...tutStepText,
});
doorTutorialScreen.addText({
  text: "…sem fazer barulho.",
  leadingImage: { filename: "quiet.png", ...tutIcon, size: 13 },
  ...tutStepText,
});

doorTutorialScreen.endFlexSection();
doorTutorialScreen.endFlexRow();

doorTutorialScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
});
