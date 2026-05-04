import { ensureCurrentTeamRecord, getQuestionId, markQuestionAnswered } from "./team.js";

export function getCurrentTeamPoints(state) {
  const { teamId, team } = getCurrentTeamStats(state);
  return { team: teamId, points: team?.points ?? 0 };
}

export function getCurrentTeamStats(state) {
  const team = ensureCurrentTeamRecord(state);
  return { teamId: team?.code || "", team };
}

export function recordQuizHistory(state, answer) {
  const { teamId, team } = getCurrentTeamStats(state);
  const videoId = state.selectedVideoId ?? "desconhecido";
  const questionKey = getQuestionId(answer, videoId);
  if (!team) {
    return { teamId: "", videoId, questionKey, history: [], hadWrongBefore: false };
  }

  if (!team.quizHistory[videoId]) team.quizHistory[videoId] = {};
  if (!team.quizHistory[videoId][questionKey]) team.quizHistory[videoId][questionKey] = [];
  const history = team.quizHistory[videoId][questionKey];
  const hadWrongBefore = history.includes(false);
  history.push(!!answer.isCorrect);
  markQuestionAnswered(state, questionKey);

  return {
    teamId,
    videoId,
    questionKey,
    history,
    hadWrongBefore,
  };
}

export function getQuizAnswerInfo(payload) {
  return {
    isCorrect: !!(payload && payload.isCorrect),
    question: payload?.question ?? "",
    chosenIndex: payload?.chosenIndex ?? null,
    chosenText: payload?.chosenText ?? "",
    correctIndex: payload?.correctIndex ?? null,
  };
}
