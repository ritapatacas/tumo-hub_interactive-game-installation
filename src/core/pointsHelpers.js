// Simple helpers for quiz + team points.
// Goal: students only call small functions (no complex state updates here).

import { getQuizAnswerInfo, recordQuizHistory, getCurrentTeamStats } from "./quizPoints.js";
import { applyNoisePenalty } from "./noisePoints.js";

export function answerIsCorrect(payloadOrAnswer) {
  if (!payloadOrAnswer) return false;
  if (typeof payloadOrAnswer === "object" && "isCorrect" in payloadOrAnswer) {
    return !!payloadOrAnswer.isCorrect;
  }
  return false;
}

// Normalizes payload AND records history for the current team.
// Students can call: recordAnswer(ctx)
// Returns useful info for simple scoring rules.
export function recordAnswer(ctxOrState, maybePayload) {
  let state = ctxOrState;
  let payload = maybePayload;

  // If first argument looks like a context object, extract state/payload from it.
  if (ctxOrState && typeof ctxOrState === "object" && "state" in ctxOrState && "payload" in ctxOrState) {
    state = ctxOrState.state;
    payload = ctxOrState.payload;
  }

  let answer = getQuizAnswerInfo(payload);
  let historyInfo = recordQuizHistory(state, answer);

  let wrongTotal = 0;
  for (let i = 0; i < historyInfo.history.length; i += 1) {
    if (historyInfo.history[i] === false) wrongTotal += 1;
  }

  return {
    answer: answer,
    teamId: historyInfo.teamId,
    hadWrongBefore: historyInfo.hadWrongBefore,
    wrongAnswerTotal: wrongTotal,
    attemptsTotal: historyInfo.history.length,
  };
}

export function teamId(state) {
  return (state?.teamName || "Equipa").toString();
}

export function teamPoints(state, id = teamId(state)) {
  if (!state.teams) state.teams = {};
  if (typeof state.teams[id] !== "number") state.teams[id] = 0;
  return state.teams[id];
}

// Adds (or subtracts) points, clamps to >= 0, syncs UI and persistence.
export function addTeamPoints(context, delta, id = teamId(context.state)) {
  let safeDelta = Number.isFinite(delta) ? delta : 0;
  let current = teamPoints(context.state, id);
  let next = Math.max(0, current + safeDelta);

  context.state.teams[id] = next;

  // Keep teamStats (if used) in sync.
  let stats = getCurrentTeamStats(context.state);
  stats.team.points = next;

  if (context.persistTeams) context.persistTeams();
  if (context.ui && context.ui.addTeamScore) context.ui.addTeamScore(id, next);

  return next;
}

// Convenience: applies a noise penalty using the existing core rule.
export function applyNoisePenaltySimple(context, penalty, message) {
  applyNoisePenalty(context.ui, context.state, { penalty: penalty, message: message });
  if (context.persistTeams) context.persistTeams();
}
