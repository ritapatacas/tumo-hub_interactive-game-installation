import { Screen } from "../../src/core/Screen.js";
import { QUIZ_FEEDBACK_DOCK_MS } from "../../src/core/actions.js";
import { getTeam, getTopLeaderboard } from "../../src/core/team.js";

export const doorLeaderboardScreen = new Screen("leaderboard");

doorLeaderboardScreen.setBackgroundImage({
  filename: "bg-02.png",
  size: "cover",
  position: "center center",
});

doorLeaderboardScreen.setLayout({
  align: { horizontal: "center", vertical: "top" },
  gap: 38,
  maxWidth: 1080,
});

doorLeaderboardScreen.addText({ text: "Leaderboard", variant: "title", marginTop: 220, marginBottom: 40 });
doorLeaderboardScreen.addLeaderboardFromState((state) => getTopLeaderboard(state.teams, 10));

doorLeaderboardScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
  const dock = state.pendingQuizFeedbackDock;
  if (dock && typeof dock === "object") {
    state.pendingQuizFeedbackDock = null;
    ui.showMessage("", {
      dock: "top-left",
      html: dock.html,
      ariaLabel: dock.ariaLabel ?? "",
      boxClassName: dock.boxClassName,
      duration: typeof dock.duration === "number" ? dock.duration : QUIZ_FEEDBACK_DOCK_MS,
    });
  }
});
