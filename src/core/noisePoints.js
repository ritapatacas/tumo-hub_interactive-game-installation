import { ensureCurrentTeamRecord } from "./team.js";

export function applyNoisePenalty(ui, state, { penalty, message }) {
  const team = ensureCurrentTeamRecord(state);
  if (!team) return;

  const safePenalty = Number.isFinite(penalty) ? penalty : 0;
  team.points = Math.max(0, team.points - safePenalty);

  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
  ui.showMessage(message, {
    type: "error",
    duration: 1500,
  });
}
