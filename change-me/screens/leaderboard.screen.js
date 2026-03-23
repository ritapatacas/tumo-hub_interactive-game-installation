import { Screen } from "../../src/core/Screen.js";
import { getTopLeaderboard } from "../../src/core/team.js";

let leaderboardAnyKeyHandler = null;

export let leaderboardScreen = new Screen("leaderboard");

// --- Imagem de fundo ---
leaderboardScreen.setBackgroundImage({
  filename: "bg-02.png",
  size: "cover",
  position: "center center",
});

leaderboardScreen.setLayout({
  align: { horizontal: "center", vertical: "middle" },
  gap: 38,
  maxWidth: 1080,
});

leaderboardScreen.addText({ text: "Leaderboard", variant: "title", marginBottom: 40 });

leaderboardScreen.addLeaderboardFromState((state) => getTopLeaderboard(state.teams, 10));

leaderboardScreen.setCornerHint({ text: "PRESS ANY KEY" });

leaderboardScreen.onEnter(({ ui }) => {
  leaderboardAnyKeyHandler = (e) => {
    if (e.repeat) return;
    if (e.key === "Tab") return;
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
    ui.runAction("goHome");
  };
  window.addEventListener("keydown", leaderboardAnyKeyHandler);
});

leaderboardScreen.onExit(() => {
  if (leaderboardAnyKeyHandler) {
    window.removeEventListener("keydown", leaderboardAnyKeyHandler);
    leaderboardAnyKeyHandler = null;
  }
});