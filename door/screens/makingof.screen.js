import { Screen } from "../../src/core/Screen.js";

export const doorMakingofScreen = new Screen("door-makingof");

doorMakingofScreen.setLayout({
  gap: 0,
  maxWidth: "100%",
});

doorMakingofScreen.setBackgroundImage({
  filename: "bg-07.png",
  size: "cover",
  position: "center center",
});
