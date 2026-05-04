import { sanitizeTeams } from "./team.js";

export const DUMMY_LEADERBOARD_TEAMS = {
  "#CZ88": { code: "#CZ88", name: "Ctrl+Z", points: 88 },
  "#BF84": { code: "#BF84", name: "Bug&Fix", points: 84 },
  "#4X81": { code: "#4X81", name: "404x2", points: 81 },
  "#TP77": { code: "#TP77", name: "Telepatia", points: 77 },
  "#DN73": { code: "#DN73", name: "Dois Neurónios", points: 73 },
  "#DQ69": { code: "#DQ69", name: "Dupla Quase Boa", points: 69 },
  "#TV64": { code: "#TV64", name: "TeamTalvez", points: 64 },
  "#AP59": { code: "#AP59", name: "Ajuda do Público", points: 59 },
  "#DS45": { code: "#DS45", name: "DoisÀSorte", points: 45 },
  "#QP31": { code: "#QP31", name: "Quase Pro", points: 31 },
};

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
  const teams = sanitizeTeams(state.teams);
  const empty = Object.keys(teams).length === 0;
  if (forceOff || (!forceOn && !empty)) return;
  state.teams = { ...sanitizeTeams(DUMMY_LEADERBOARD_TEAMS), ...teams };
}
