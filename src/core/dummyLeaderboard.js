/**
 * Top 10 fictício para o leaderboard (nome → pontos).
 * - Sem equipas guardadas: estes dados preenchem o ranking automaticamente.
 * - `?dummyLeaderboard=1` ou `true` (também no fragmento: `#/?dummyLeaderboard=1`): força a misturar com dados reais.
 * - `?dummyLeaderboard=0` ou `false`: não injeta dummy mesmo com lista vazia.
 * Equipas reais em `localStorage` sobrepõem nomes iguais.
 */
export const DUMMY_LEADERBOARD_TEAMS = {
  "Ctrl+Z": 88,
  "Bug&Fix": 84,
  "404x2": 81,
  Telepatia: 77,
  "Dois Neurónios": 73,
  "Dupla Quase Boa": 69,
  TeamTalvez: 64,
  "Ajuda do Público": 59,
  "DoisÀSorte": 45,
  "Quase Pro": 31,
};

/** `?x=1` no path ou após `#` (ex.: `#/?dummyLeaderboard=1`). */
function readUrlSearchParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  const search = window.location.search;
  if (search && search.length > 1) {
    return new URLSearchParams(search);
  }
  const hash = window.location.hash;
  const qi = hash.indexOf("?");
  if (qi >= 0) {
    return new URLSearchParams(hash.slice(qi + 1));
  }
  return new URLSearchParams();
}

export function mergeDummyLeaderboardIfEnabled(state) {
  if (typeof window === "undefined") return;
  const params = readUrlSearchParams();
  const raw = params.get("dummyLeaderboard");
  const v = raw == null ? "" : String(raw).trim().toLowerCase();
  const forceOn = v === "1" || v === "true" || v === "yes" || v === "on";
  const forceOff = v === "0" || v === "false" || v === "no" || v === "off";
  const teams = state.teams && typeof state.teams === "object" ? state.teams : {};
  const empty = Object.keys(teams).length === 0;
  if (forceOff || (!forceOn && !empty)) return;
  state.teams = { ...DUMMY_LEADERBOARD_TEAMS, ...teams };
}
