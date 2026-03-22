import { Screen } from "../../src/core/Screen.js";

export let waitingScreen = new Screen("waiting");

waitingScreen.setLayout({
  align: { horizontal: "center", vertical: "middle" },
  gap: 20,
  maxWidth: 900,
});

waitingScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});



waitingScreen.addText({ text: "A reproduzir o vídeo!", variant: "title", shadow: true });


waitingScreen.onEnter(({ ui, payload }) => {
  
  const message = payload?.message || "A sessão está a avançar no outro ecrã.";
  ui.beginShadowBox();
  ui.addText({ text: message, variant: "body" });
  ui.endShadowBox();
});
