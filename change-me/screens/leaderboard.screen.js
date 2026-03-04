import { Screen } from "../../src/core/Screen.js";
import { getTopLeaderboard } from "../../src/core/team.js";

export let leaderboardScreen = new Screen("leaderboard");

leaderboardScreen.setLayout({
  align: { horizontal: "center", vertical: "top" },
  gap: 16,
  maxWidth: 720,
});


leaderboardScreen.onEnter(({ ui, state }) => {
  const teams = getTopLeaderboard(state.teams, 10);
  ui.addLeaderboard({ teams });
});
