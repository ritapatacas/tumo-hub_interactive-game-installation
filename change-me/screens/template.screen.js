import { Screen } from "../../src/core/Screen.js";

export let templateScreen = new Screen("template");

templateScreen.setLayout({
  gap: 40,
  align: { horizontal: "center", vertical: "middle" },
  maxWidth: 720,
});

// --- Imagem de fundo ---
templateScreen.setBackgroundImage({
  filename: "bg-01.png",
  size: "cover",
  position: "center center",
});

// --- Conteúdo principal dentro de uma shadow box ---
templateScreen.addText({ text: "Title", variant: "title", shadow: true });
templateScreen.beginShadowBox();
templateScreen.addText({ text: "Text muted", variant: "muted" });
templateScreen.addText({ text: "Text body.", variant: "body" });
templateScreen.endShadowBox();

// --- Navegação entre ecrãs ---
templateScreen.addText({ text: "Botões de acesso aos ecrãs", variant: "muted" });
templateScreen.beginFlexRow({ gap: 12, justify: "center" });
templateScreen.addButton({ label: "Home", action: "goHome" });
templateScreen.addButton({ label: "Tutorial", action: "goTutorial" });
templateScreen.addButton({ label: "Galeria", action: "goGallery" });
templateScreen.addButton({ label: "Quiz", action: "goQuiz" });
templateScreen.addButton({ label: "Vídeo", action: "goVideo" });
templateScreen.addButton({ label: "Leaderboard", action: "goLeaderboard" });
templateScreen.endFlexRow();
