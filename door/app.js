import { theme } from "../change-me/theme.js";
import { doorHomeScreen } from "./screens/home.screen.js";

export { theme };

export const screens = [doorHomeScreen];

export const actions = {
  goHome: ({ goTo }) => goTo("home"),
};
