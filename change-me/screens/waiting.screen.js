import { Screen } from "../../src/core/Screen.js";

export let waitingScreen = new Screen("waiting");

waitingScreen.setLayout({
  align: { horizontal: "center", vertical: "middle" },
  gap: 20,
  maxWidth: 1080,
});

waitingScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

waitingScreen.addText({
  text: "A reproduzir o vídeo!",
  variant: "title",
  shadow: true,
  fontSize: "clamp(32px, 5vw, 58px)",
});

waitingScreen.onEnter(({ ui, payload }) => {
  const message = payload?.message || "A sessão está a avançar no outro ecrã.";
  ui.beginShadowBox();
  ui.addText({ text: message, variant: "body", fontSize: "clamp(26px, 3vw, 42px)" });
  ui.endShadowBox();
});
