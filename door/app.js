import { theme } from "../change-me/theme.js";
import { doorHomeScreen } from "./screens/home.screen.js";
import { doorLeaderboardScreen } from "./screens/leaderboard.screen.js";
import { clearDoorMakingofSlideshow, doorMakingofScreen } from "./screens/makingof.screen.js";
import { doorTutorialScreen } from "./screens/tutorial.screen.js";

export { theme };

export const screens = [doorHomeScreen, doorTutorialScreen, doorMakingofScreen, doorLeaderboardScreen];

const DOOR_SCREEN_ORDER = ["home", "door-tutorial", "door-makingof", "leaderboard"];

function clearDoorTimer(state) {
  if (state.__doorAutoAdvanceTimerId) {
    clearTimeout(state.__doorAutoAdvanceTimerId);
    state.__doorAutoAdvanceTimerId = null;
  }
}

function getNextDoorScreen(currentName) {
  const currentIndex = DOOR_SCREEN_ORDER.indexOf(currentName);
  if (currentIndex === -1) return DOOR_SCREEN_ORDER[0];
  return DOOR_SCREEN_ORDER[(currentIndex + 1) % DOOR_SCREEN_ORDER.length];
}

const DEFAULT_DOOR_SCREEN_MS = 15000;

function scheduleDoorAdvance(ctx, currentName, durationMs = DEFAULT_DOOR_SCREEN_MS) {
  clearDoorTimer(ctx.state);
  ctx.state.__doorAutoAdvanceTimerId = setTimeout(() => {
    ctx.state.__doorAutoAdvanceTimerId = null;
    ctx.goTo(getNextDoorScreen(currentName));
  }, durationMs);
}

function mountDoorAdvance(screen, currentName, { onExit } = {}) {
  screen.onEnter((ctx) => {
    scheduleDoorAdvance(ctx, currentName, screen.autoAdvanceMs);
  });
  screen.onExit(({ state }) => {
    clearDoorTimer(state);
    if (onExit) onExit(state);
  });
  screen.onKeyDown("Enter", "goDoorNext", { preventDefault: true });
}

mountDoorAdvance(doorHomeScreen, "home");
mountDoorAdvance(doorTutorialScreen, "door-tutorial");
mountDoorAdvance(doorMakingofScreen, "door-makingof", { onExit: clearDoorMakingofSlideshow });
mountDoorAdvance(doorLeaderboardScreen, "leaderboard");

export const actions = {
  goHome: ({ goTo }) => goTo("home"),
  goGallery: ({ goTo }) => goTo("home"),
  endGameAndGoHome: ({ goTo }) => goTo("home"),
  goDoorNext: ({ goTo, screen }) => goTo(getNextDoorScreen(screen)),
};
