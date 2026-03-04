export function applyNoisePenalty(ui, state, { penalty, message }) {
  const team = state.teamName || "Equipa";
  if (state.teams[team] === undefined) state.teams[team] = 0;

  const safePenalty = Number.isFinite(penalty) ? penalty : 0;
  state.teams[team] = Math.max(0, state.teams[team] - safePenalty);

  ui.addTeamScore(team, state.teams[team]);
  ui.showMessage(message, {
    type: "error",
    duration: 1500,
  });
}

