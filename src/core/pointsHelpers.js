import { getQuizAnswerInfo, recordQuizHistory, getCurrentTeamStats } from "./quizPoints.js";
import { applyNoisePenalty } from "./noisePoints.js";
import { ensureCurrentTeamRecord } from "./team.js";

export function answerIsCorrect(payloadOrAnswer) {
  if (!payloadOrAnswer) return false;
  if (typeof payloadOrAnswer === "object" && "isCorrect" in payloadOrAnswer) {
    return !!payloadOrAnswer.isCorrect;
  }
  return false;
}

export function recordAnswer(ctxOrState, maybePayload) {
  let state = ctxOrState;
  let payload = maybePayload;

  if (ctxOrState && typeof ctxOrState === "object" && "state" in ctxOrState && "payload" in ctxOrState) {
    state = ctxOrState.state;
    payload = ctxOrState.payload;
  }

  const answer = getQuizAnswerInfo(payload);
  const historyInfo = recordQuizHistory(state, answer);

  let wrongTotal = 0;
  for (let i = 0; i < historyInfo.history.length; i += 1) {
    if (historyInfo.history[i] === false) wrongTotal += 1;
  }

  return {
    answer,
    teamId: historyInfo.teamId,
    hadWrongBefore: historyInfo.hadWrongBefore,
    wrongAnswerTotal: wrongTotal,
    attemptsTotal: historyInfo.history.length,
  };
}

export function teamId(state) {
  const record = ensureCurrentTeamRecord(state);
  return record?.code || "";
}

export function teamPoints(state, id = teamId(state)) {
  const record = ensureCurrentTeamRecord(state);
  if (!record) return 0;
  if (id && record.code !== id) {
    const other = state.teams?.[id];
    return Number.isFinite(Number(other?.points)) ? Number(other.points) : 0;
  }
  return Number.isFinite(Number(record.points)) ? Number(record.points) : 0;
}

export function addTeamPoints(context, delta, id = teamId(context.state)) {
  const safeDelta = Number.isFinite(delta) ? delta : 0;
  const stats = getCurrentTeamStats(context.state);
  const record = stats.team;
  const current = teamPoints(context.state, id);
  const next = Math.max(0, current + safeDelta);
  if (!record) return 0;
  record.points = next;

  if (context.persistTeams) context.persistTeams();
  if (context.ui && context.ui.addTeamScore) {
    context.ui.addTeamScore(record.name, next, { teamCode: record.code });
  }

  return next;
}

export function applyNoisePenaltySimple(context, penalty, message) {
  applyNoisePenalty(context.ui, context.state, { penalty, message });
  if (context.persistTeams) context.persistTeams();
}
