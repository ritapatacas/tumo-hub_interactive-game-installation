import { Screen } from "../../src/core/Screen.js";
import { getTeam, getTopLeaderboard } from "../../src/core/team.js";
import { QUIZ_FEEDBACK_DOCK_MS } from "./quiz.screen.js";

let leaderboardKeyHandler = null;

export let leaderboardScreen = new Screen("leaderboard");

// --- Imagem de fundo ---
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

leaderboardScreen.addMountStep(({ ui, state }) => {
  if (document.body.dataset.role === "p1") {
    ui.setCornerHint({ text: "" });
    return;
  }
  const hasTeam = String(state.teamName ?? "").trim().length > 0;
  if (hasTeam) {
    ui.setCornerHint({
      html:
        'PRIME:<br><span class="ui-corner-hint-dot ui-corner-hint-dot--white" aria-hidden="true">⬤</span> PARA JOGAR NOVAMENTE<br><span class="ui-corner-hint-dot ui-corner-hint-dot--red" aria-hidden="true">⬤</span> PARA TERMINAR O JOGO',
      ariaLabel:
        "Prima o botão branco para jogar novamente, o botão vermelho para terminar o jogo",
      className: "ui-corner-hint-badge--wide",
    });
  } else {
    ui.setCornerHint({
      html:
        'PRIME:<br><span class="ui-corner-hint-dot ui-corner-hint-dot--white" aria-hidden="true">⬤</span> PARA VOLTAR',
      ariaLabel: "Prima o botão branco para voltar",
      className: "ui-corner-hint-badge--wide",
    });
  }
});

leaderboardScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);

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

  leaderboardKeyHandler = (e) => {
    if (e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
    if (t && t.isContentEditable) return;

    const isP2 = document.body.dataset.role !== "p1";
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const hasTeam = String(state.teamName ?? "").trim().length > 0;

    if (isP2 && k === "b") {
      e.preventDefault();
      ui.runAction(hasTeam ? "goGallery" : "goHome");
      return;
    }
    if (isP2 && k === "v" && hasTeam) {
      e.preventDefault();
      ui.runAction("endGameAndGoHome");
      return;
    }

    if (e.key === "Tab") return;
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
    ui.runAction("goHome");
  };
  window.addEventListener("keydown", leaderboardKeyHandler);
});

leaderboardScreen.onExit(() => {
  if (leaderboardKeyHandler) {
    window.removeEventListener("keydown", leaderboardKeyHandler);
    leaderboardKeyHandler = null;
  }
});