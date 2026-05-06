const TEAM_CODE_PATTERN = /^#[A-Z0-9]{4}$/;
const TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function normalizeCode(value) {
  return String(value ?? "").trim().toUpperCase();
}

function sanitizeStringList(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const next = [];
  for (const item of items) {
    const value = String(item ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    next.push(value);
  }
  return next;
}

function sanitizeQuizHistory(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const next = {};
  for (const [videoId, rawQuestions] of Object.entries(input)) {
    const safeVideoId = String(videoId ?? "").trim();
    if (!safeVideoId || !rawQuestions || typeof rawQuestions !== "object" || Array.isArray(rawQuestions)) continue;
    const safeQuestions = {};
    for (const [questionId, rawAttempts] of Object.entries(rawQuestions)) {
      const safeQuestionId = String(questionId ?? "").trim();
      if (!safeQuestionId || !Array.isArray(rawAttempts)) continue;
      safeQuestions[safeQuestionId] = rawAttempts.map((value) => !!value);
    }
    if (Object.keys(safeQuestions).length > 0) {
      next[safeVideoId] = safeQuestions;
    }
  }
  return next;
}

export function isTeamCode(value) {
  return TEAM_CODE_PATTERN.test(normalizeCode(value));
}

export function generateTeamCode(teams) {
  const existing = new Set(Object.keys(teams || {}).map((code) => normalizeCode(code)));
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    let code = "#";
    for (let i = 0; i < 4; i += 1) {
      const index = Math.floor(Math.random() * TEAM_CODE_ALPHABET.length);
      code += TEAM_CODE_ALPHABET[index];
    }
    if (!existing.has(code)) {
      return code;
    }
  }
  throw new Error("Could not generate a unique team code.");
}

export function createTeamRecord(name, code, points = 0) {
  const safeName = String(name ?? "").trim() || "Equipa";
  const safeCode = normalizeCode(code);
  const safePoints = Number.isFinite(Number(points)) ? Math.max(0, Math.round(Number(points))) : 0;
  return {
    code: safeCode,
    name: safeName,
    points: safePoints,
    viewedVideoIds: [],
    answeredQuestionIds: [],
    quizHistory: {},
  };
}

export function sanitizeTeams(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const next = {};

  for (const [rawKey, rawValue] of Object.entries(input)) {
    if (typeof rawValue === "number") {
      const name = String(rawKey ?? "").trim();
      if (!name) continue;
      const code = generateTeamCode(next);
      next[code] = createTeamRecord(name, code, rawValue);
      continue;
    }

    if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) continue;

    const name = String(rawValue.name ?? rawKey ?? "").trim();
    if (!name) continue;

    let code = normalizeCode(rawValue.code || rawKey);
    if (!isTeamCode(code) || next[code]) {
      code = generateTeamCode(next);
    }

    const record = createTeamRecord(name, code, rawValue.points);
    record.viewedVideoIds = sanitizeStringList(rawValue.viewedVideoIds);
    record.answeredQuestionIds = sanitizeStringList(rawValue.answeredQuestionIds);
    record.quizHistory = sanitizeQuizHistory(rawValue.quizHistory);
    next[code] = record;
  }

  return next;
}

export function getTeamRecordByCode(teams, code) {
  const safeCode = normalizeCode(code);
  if (!safeCode) return null;
  if (!teams || typeof teams !== "object") return null;
  return teams[safeCode] ?? null;
}

export function getCurrentTeamRecord(state) {
  const teams = sanitizeTeams(state?.teams);
  if (state) {
    state.teams = teams;
  }

  const byCode = getTeamRecordByCode(teams, state?.teamCode);
  if (byCode) {
    return byCode;
  }

  const name = String(state?.teamName ?? "").trim();
  if (!name) return null;

  for (const record of Object.values(teams)) {
    if (record.name === name) {
      if (state) state.teamCode = record.code;
      return record;
    }
  }

  return null;
}

export function setCurrentTeam(state, record) {
  if (!state) return null;
  if (!record) {
    state.teamName = "";
    state.teamCode = "";
    return null;
  }
  state.teamName = record.name;
  state.teamCode = record.code;
  return record;
}

export function ensureCurrentTeamRecord(state) {
  if (!state) return null;
  const existing = getCurrentTeamRecord(state);
  if (existing) return existing;

  const teams = sanitizeTeams(state.teams);
  state.teams = teams;
  const name = String(state.teamName ?? "").trim() || "Equipa";
  const code = generateTeamCode(teams);
  const record = createTeamRecord(name, code, 0);
  teams[code] = record;
  setCurrentTeam(state, record);
  return record;
}

export function getQuestionId(answer, videoId) {
  const question = String(answer?.question ?? "").trim();
  if (question) return `${videoId}::${question}`;
  const correctIndex = Number(answer?.correctIndex);
  if (Number.isFinite(correctIndex)) return `${videoId}::pergunta-${correctIndex}`;
  return `${videoId}::pergunta`;
}

export function markVideoViewed(state, videoId) {
  const safeVideoId = String(videoId ?? "").trim();
  if (!safeVideoId) return;
  const record = ensureCurrentTeamRecord(state);
  if (!record) return;
  if (!record.viewedVideoIds.includes(safeVideoId)) {
    record.viewedVideoIds.push(safeVideoId);
  }
}

export function markQuestionAnswered(state, questionId) {
  const safeQuestionId = String(questionId ?? "").trim();
  if (!safeQuestionId) return;
  const record = ensureCurrentTeamRecord(state);
  if (!record) return;
  if (!record.answeredQuestionIds.includes(safeQuestionId)) {
    record.answeredQuestionIds.push(safeQuestionId);
  }
}

export function persistStateTeam(ctx) {
  const state = ctx.state;
  const ui = ctx.ui;
  const persistTeams = ctx.persistTeams;
  const input = String(ui.getInputValue("teamName") ?? "").trim();

  if (!input) {
    return { ok: false, reason: "empty" };
  }

  state.teams = sanitizeTeams(state.teams);

  if (isTeamCode(input)) {
    const code = normalizeCode(input);
    const existing = state.teams[code];
    if (!existing) {
      return { ok: false, reason: "code-not-found", code };
    }
    setCurrentTeam(state, existing);
    persistTeams?.();
    return { ok: true, created: false, record: existing };
  }

  const code = generateTeamCode(state.teams);
  const record = createTeamRecord(input, code, 0);
  state.teams[code] = record;
  setCurrentTeam(state, record);
  persistTeams?.();
  return { ok: true, created: true, record };
}

export function applyNoisePenalty(ctx, penalty) {
  const { state, persistTeams } = ctx;
  const record = ensureCurrentTeamRecord(state);
  if (!record) return { teamName: "Equipa", teamCode: "", score: 0 };

  const safePenalty = Number.isFinite(Number(penalty)) ? Math.max(0, Math.round(Number(penalty))) : 0;
  record.points = Math.max(0, record.points - safePenalty);
  persistTeams?.();

  return { teamName: record.name, teamCode: record.code, score: record.points };
}

export function showNoisePenalty(ctx, team, penalty) {
  ctx.ui.addTeamScore(team.teamName, team.score, { teamCode: team.teamCode });
  ctx.ui.showMessage("", {
    dock: "top-left",
    boxClassName: "ui-shadow-box--noise-penalty",
    duration: 4500,
    ariaLabel: `Demasiado ruído. Menos ${penalty} pts.`,
    html: `DEMASIADO RUÍDO!<br>-${penalty} pts`,
  });
}

export function getTeam(state) {
  const record = getCurrentTeamRecord(state);
  if (!record) {
    return {
      name: String(state?.teamName ?? "").trim() || "Equipa",
      code: String(state?.teamCode ?? "").trim(),
      points: 0,
    };
  }

  return {
    name: record.name,
    code: record.code,
    points: record.points ?? 0,
  };
}

export function getTopLeaderboard(teams, limit) {
  const list = Object.values(sanitizeTeams(teams))
    .map((record) => ({
      name: record.name,
      code: record.code,
      points: Number.isFinite(Number(record.points)) ? Number(record.points) : 0,
    }))
    .sort((a, b) => b.points - a.points);

  if (typeof limit === "number" && limit > 0) {
    const sliced = list.slice(0, limit);
    while (sliced.length < limit) {
      sliced.push({ name: "", code: "", points: null });
    }
    return sliced;
  }

  return list;
}

export function getLeaderboardWithCurrentTeam(teams, currentTeamCode, topLimit = 15) {
  const safeCode = normalizeCode(currentTeamCode);
  const list = Object.values(sanitizeTeams(teams))
    .map((record) => ({
      name: record.name,
      code: record.code,
      points: Number.isFinite(Number(record.points)) ? Number(record.points) : 0,
    }))
    .sort((a, b) => b.points - a.points)
    .map((record, index) => ({
      ...record,
      rank: index + 1,
      isCurrent: safeCode !== "" && record.code === safeCode,
    }));

  const safeTopLimit = Math.max(1, Math.floor(Number(topLimit) || 15));
  const top = list.slice(0, safeTopLimit);

  if (!safeCode) return top;

  const alreadyIncluded = top.some((team) => team.code === safeCode);
  if (alreadyIncluded) return top;

  const current = list.find((team) => team.code === safeCode);
  if (!current) return top;

  return [...top, current];
}
