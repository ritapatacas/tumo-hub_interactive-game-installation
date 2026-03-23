export function persistStateTeam(ctx) {
  const state = ctx.state;
  const ui = ctx.ui;
  const persistTeams = ctx.persistTeams;

  const input = ui.getInputValue("teamName");
  const name = (input ?? "").trim();
  if (!name) return "";

  state.teamName = name;

  if (state.teams[state.teamName] === undefined) {
    state.teams[state.teamName] = 0;
    persistTeams?.();
  }

  return state.teamName;
}

export function applyNoisePenalty(ctx, penalty) {
  const { state, persistTeams } = ctx;
  const teamName = state.teamName || "Equipa";

  if (state.teams[teamName] === undefined) {
    state.teams[teamName] = 0;
  }

  state.teams[teamName] = Math.max(0, state.teams[teamName] - penalty);
  persistTeams?.();

  return { teamName, score: state.teams[teamName] };
}

export function showNoisePenalty(ctx, team, penalty) {
  ctx.ui.addTeamScore(team.teamName, team.score);
  ctx.ui.showMessage("", {
    dock: "top-left",
    boxClassName: "ui-shadow-box--noise-penalty",
    duration: 4500,
    ariaLabel: `Demasiado ruído. Menos ${penalty} pts.`,
    html: `DEMASIADO RUÍDO!<br>-${penalty} pts`,
  });
}

export function getTeam(state) {
  let name = "Equipa";
  if (state.teamName && state.teamName !== "") {
    name = state.teamName;
  }

  const teams = state.teams || {};
  let points = 0;
  if (teams[name] !== undefined) {
    points = teams[name];
  }

  return {
    name,
    points,
  };
}

export function getTopLeaderboard(teams, limit) {
  const entries = Object.entries(teams || {});

  const list = entries
    .map(([name, points]) => {
      let value = Number(points);
      if (!Number.isFinite(value)) {
        value = 0;
      }
      return { name, points: value };
    })
    .sort((a, b) => b.points - a.points);

  if (typeof limit === "number" && limit > 0) {
    const sliced = list.slice(0, limit);
    while (sliced.length < limit) {
      sliced.push({ name: "", points: null });
    }
    return sliced;
  }

  return list;
}


