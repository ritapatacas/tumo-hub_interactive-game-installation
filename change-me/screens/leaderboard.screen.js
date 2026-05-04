import { Screen } from "../../src/core/Screen.js";
import { getTeam, getTopLeaderboard } from "../../src/core/team.js";
import { buildCornerHintMarkup } from "../../src/core/ui.js";
import { QUIZ_FEEDBACK_DOCK_MS } from "../../src/core/actions.js";
import { bindLeaderboardInput } from "../../src/core/screenBindings.js";

export let leaderboardScreen = new Screen("leaderboard");

leaderboardScreen.setBackgroundImage({
  filename: "bg-02.png",
  size: "cover",
  position: "center center",
});

leaderboardScreen.setLayout({
  align: { horizontal: "center", vertical: "top" },
  gap: 38,
  maxWidth: 1080,
});

leaderboardScreen.addText({ text: "Leaderboard", variant: "title", marginTop: 220, marginBottom: 40 });
leaderboardScreen.addLeaderboardFromState((state) => getTopLeaderboard(state.teams, 10));

leaderboardScreen.addMountStep(({ ui, state, isP1 }) => {
  if (isP1) {
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
  ui.beginShadowBox({ dock: "bottom-left", radius: "4px" });
  ui.setCornerHint({ html, ariaLabel, className: "ui-corner-hint-badge--wide", inline: true });
  ui.endShadowBox();
});

leaderboardScreen.addBinding(bindLeaderboardInput);

leaderboardScreen.onEnter(({ ui, state }) => {
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
