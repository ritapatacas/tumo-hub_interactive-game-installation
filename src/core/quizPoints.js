// Helpers for quiz scoring. Students can use these from change-me code.

// Devolve o nome da equipa atual e os pontos atuais (mantém compatibilidade).
export function getCurrentTeamPoints(state) {
  const { teamId, team } = getCurrentTeamStats(state);
  return { team: teamId, points: team.points ?? 0 };
}

// Devolve um objeto de equipa com a estrutura:
// {
//   id: "NomeDaEquipa",
//   points: 0,
//   quiz: {
//     [videoId]: {
//       [questionKey]: [true, false, true] // histórico de respostas
//     }
//   }
// }
export function getCurrentTeamStats(state) {
  const teamId = state.teamName || "Equipa";
  if (!state.teamStats) state.teamStats = {};
  let team = state.teamStats[teamId];

  if (!team) {
    const existingPoints =
      state.teams && typeof state.teams[teamId] === "number"
        ? state.teams[teamId]
        : 0;
    team = { id: teamId, points: existingPoints, quiz: {} };
    state.teamStats[teamId] = team;
  }

  // Mantém state.teams sincronizado com team.points (para o resto da app).
  if (!state.teams) state.teams = {};
  if (typeof state.teams[teamId] !== "number") {
    state.teams[teamId] = team.points ?? 0;
  }

  return { teamId, team };
}

// Regista no histórico da equipa se a resposta a uma pergunta foi certa ou errada.
// Estrutura: team.quiz[videoId][questionKey] = [true, false, true, ...]
export function recordQuizHistory(state, answer) {
  const { teamId, team } = getCurrentTeamStats(state);
  const videoId = state.selectedVideoId ?? "desconhecido";
  const questionKey = answer.question || `pergunta-${answer.correctIndex ?? 0}`;

  if (!team.quiz[videoId]) team.quiz[videoId] = {};
  if (!team.quiz[videoId][questionKey]) team.quiz[videoId][questionKey] = [];
  const history = team.quiz[videoId][questionKey];
  const hadWrongBefore = history.includes(false);
  history.push(!!answer.isCorrect);

  return {
    teamId,
    videoId,
    questionKey,
    history,
    hadWrongBefore,
  };
}


// Devolve informação sobre a resposta ao quiz (inclui se está correta e qual era a pergunta).
export function getQuizAnswerInfo(payload) {
  return {
    isCorrect: !!(payload && payload.isCorrect),
    question: payload?.question ?? "",
    chosenIndex: payload?.chosenIndex ?? null,
    chosenText: payload?.chosenText ?? "",
    correctIndex: payload?.correctIndex ?? null,
  };
}

