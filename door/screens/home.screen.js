import { Screen } from "../../src/core/Screen.js";

export const doorHomeScreen = new Screen("home");

doorHomeScreen.setLayout({
  gap: 0,
  maxWidth: "100%",
});

doorHomeScreen.setBackgroundImage({
  filename: "bg-01.png",
  size: "cover",
  position: "center center",
});
