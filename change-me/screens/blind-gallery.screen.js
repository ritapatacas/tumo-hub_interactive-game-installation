import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

export let blindGalleryScreen = new Screen("blind-gallery");

blindGalleryScreen.setLayout({
  align: { horizontal: "center", vertical: "center" },
  marginTop: 80,
  gap: 14,
});

blindGalleryScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

blindGalleryScreen.setCornerHint({ text: "Prima Enter para carregar o vídeo" });

/** P2: só quadrados, sem miniaturas nem texto; destaque igual ao P1. */
blindGalleryScreen.addSpotlightGallery({
  columns: 3,
  variant: "blind",
});

blindGalleryScreen.beginFlexRow({ gap: 12, justify: "center" });
blindGalleryScreen.addButton({ label: "Carregar vídeo selecionado", action: "loadSpotlightVideoFromGallery" });
blindGalleryScreen.addButton({ label: "Ligar Arduino", action: "connectArduino" });
blindGalleryScreen.addButton({ label: "Voltar", action: "goHome" });
blindGalleryScreen.endFlexRow();

let blindGalleryEnterKeyHandler = null;

blindGalleryScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);
  blindGalleryEnterKeyHandler = (e) => {
    if (e.key !== "Enter" || e.repeat) return;
    ui.runAction("loadSpotlightVideoFromGallery");
  };
  window.addEventListener("keydown", blindGalleryEnterKeyHandler);
});

blindGalleryScreen.onExit(() => {
  if (blindGalleryEnterKeyHandler) {
    window.removeEventListener("keydown", blindGalleryEnterKeyHandler);
    blindGalleryEnterKeyHandler = null;
  }
});
