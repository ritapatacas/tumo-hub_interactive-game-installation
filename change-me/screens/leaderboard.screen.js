import { Screen } from "../../src/core/Screen.js";
import { getTopLeaderboard } from "../../src/core/team.js";

export let leaderboardScreen = new Screen("leaderboard");

// --- Imagem de fundo ---
leaderboardScreen.setBackgroundImage({
  filename: "bg-02.png",
  size: "cover",
  position: "center center",
});

leaderboardScreen.setLayout({
  align: { horizontal: "center", vertical: "middle" },
  gap: 82,
  maxWidth: 720,
});

leaderboardScreen.addText({ text: "Leaderboard", variant: "title" });

leaderboardScreen.addLeaderboardFromState((state) => getTopLeaderboard(state.teams, 10));

leaderboardScreen.addButton({ label: "Voltar", action: "goHome" });