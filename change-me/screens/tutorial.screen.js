import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

export let tutorialScreen = new Screen("tutorial");

tutorialScreen.setLayout({ gap: 0, maxWidth: 490, marginTop: 65 });

// --- Imagem de fundo ---
tutorialScreen.setBackgroundImage({
  filename: "bg-06.png",
  size: "cover",
  position: "center center",
});

tutorialScreen.setCornerHint({ text: "Press any button" });

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

tutorialScreen.beginFlexSection();

tutorialScreen.addText({
  text: "**Player 1** vai para o outro lado da sala.\n\n**Player 2** escolhe o vídeo da ronda.\n\n**Player 1** vê o vídeo e descreve tudo ao **Player 2**.\n\n**Player 2** responde à pergunta com base no que o **Player 1** te disse.\n\n\n → Resposta certa dá pontos.\n\n→ Se houver ruído perdem pontos.\n\n→ Quando o vídeo terminar **não poderão comunicar.**",
  variant: "hand",
  fontSize: "clamp(12px, 2.4vw, 26px)",
  paragraphGap: 9,
  marginTop: -20,
});


tutorialScreen.endFlexSection();

tutorialScreen.endFlexRow();

let tutorialEnterKeyHandler = null;

tutorialScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);

  tutorialEnterKeyHandler = (e) => {
    if (e.key !== "Enter" || e.repeat) return;
    ui.runAction("goGallery");
  };
  window.addEventListener("keydown", tutorialEnterKeyHandler);
});

tutorialScreen.onExit(() => {
  if (tutorialEnterKeyHandler) {
    window.removeEventListener("keydown", tutorialEnterKeyHandler);
    tutorialEnterKeyHandler = null;
  }
});

//colocar imagens pls :3
