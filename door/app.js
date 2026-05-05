import { theme } from "../change-me/theme.js";
import { doorHomeScreen } from "./screens/home.screen.js";
import { doorLeaderboardScreen } from "./screens/leaderboard.screen.js";
import { doorMakingofScreen } from "./screens/makingof.screen.js";
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

function scheduleDoorAdvance(ctx, currentName) {
  clearDoorTimer(ctx.state);
  ctx.state.__doorAutoAdvanceTimerId = setTimeout(() => {
    ctx.state.__doorAutoAdvanceTimerId = null;
    ctx.goTo(getNextDoorScreen(currentName));
  }, 15000);
}

function mountDoorAdvance(screen, currentName) {
  screen.onEnter((ctx) => {
    scheduleDoorAdvance(ctx, currentName);
  });
  screen.onExit(({ state }) => {
    clearDoorTimer(state);
  });
  screen.onKeyDown("Enter", "goDoorNext", { preventDefault: true });
}

mountDoorAdvance(doorHomeScreen, "home");
mountDoorAdvance(doorTutorialScreen, "door-tutorial");
mountDoorAdvance(doorMakingofScreen, "door-makingof");
mountDoorAdvance(doorLeaderboardScreen, "leaderboard");

export const actions = {
  goHome: ({ goTo }) => goTo("home"),
  goGallery: ({ goTo }) => goTo("home"),
  endGameAndGoHome: ({ goTo }) => goTo("home"),
  goDoorNext: ({ goTo, screen }) => goTo(getNextDoorScreen(screen)),
};
