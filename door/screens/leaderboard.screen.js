import { Screen } from "../../src/core/Screen.js";
import { getLeaderboardWithCurrentTeam } from "../../src/core/team.js";
import { buildCornerHintMarkup } from "../../src/core/ui.js";
import { QUIZ_FEEDBACK_DOCK_MS } from "../../src/core/actions.js";
import { getTeam } from "../../src/core/team.js";

export const doorLeaderboardScreen = new Screen("leaderboard");

doorLeaderboardScreen.setBackgroundImage({
  filename: "bg-02.png",
  size: "cover",
  position: "center center",
});

doorLeaderboardScreen.setLayout({
  align: { horizontal: "center", vertical: "top" },
  gap: 14,
  maxWidth: 1080,
});

doorLeaderboardScreen.addText({
  text: "LEADERBOARD",
  variant: "title",
  fontSize: "clamp(44px, 6.2vw, 80px)",
  marginTop: 180,
  marginBottom: 10,
});

doorLeaderboardScreen.addMountStep(({ ui, state }) => {
  ui.addLeaderboard({
    teams: getLeaderboardWithCurrentTeam(state.teams, state.teamCode, 15),
    slotCount: 16,
  });
});

doorLeaderboardScreen.addMountStep(({ ui, state, isP2 }) => {
  if (isP2) {
    ui.setCornerHint({ text: "" });
    return;
  }
  const hasTeam = String(state.teamName ?? "").trim().length > 0;
  const { html, ariaLabel } = hasTeam
    ? buildCornerHintMarkup(
        [
          { color: "white", label: "JOGAR NOVAMENTE" },
          { color: "red", label: "TERMINAR O JOGO" },
        ],
        {
          ariaLabel:
            "Prima o botão branco para jogar novamente, o botão vermelho para terminar o jogo",
        }
      )
    : buildCornerHintMarkup([{ color: "white", label: "PARA VOLTAR" }], {
        ariaLabel: "Prima o botão branco para voltar",
      });
  ui.beginShadowBox({ dock: "bottom-left", radius: "8px" });
  ui.setCornerHint({ html, ariaLabel, className: "ui-corner-hint-badge--wide", inline: true });
  ui.endShadowBox();
});

doorLeaderboardScreen.onEnter(({ ui, state }) => {
  if (ui._playerRoleBadgeEl) {
    ui._playerRoleBadgeEl.remove();
    ui._playerRoleBadgeEl = null;
  }
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
