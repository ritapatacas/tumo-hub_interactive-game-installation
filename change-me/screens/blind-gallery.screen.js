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

blindGalleryScreen.beginShadowBox({ dock: "bottom-left", radius: "3px" });

blindGalleryScreen.setCornerHint({
  html:
    'PRIME:<br><span class="ui-corner-hint-dot ui-corner-hint-dot--white" aria-hidden="true">⬤</span> CONTINUAR',
  ariaLabel: "Prima o botão branco para continuar",
  className: "ui-corner-hint-badge--wide",
  inline: true,
});

blindGalleryScreen.endShadowBox();

/** P2: só quadrados, sem miniaturas nem texto; destaque igual ao P1. */
blindGalleryScreen.addSpotlightGallery({
  columns: 3,
  variant: "blind",
});

let blindGalleryKeyHandler = null;

blindGalleryScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);
  blindGalleryKeyHandler = (e) => {
    if (e.repeat) return;
    if (e.key === "Tab") return;
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

    if (e.key === "Enter") {
      ui.runAction("loadSpotlightVideoFromGallery");
      return;
    }
    if (e.key === "a" || e.key === "A") {
      ui.runAction("connectArduino");
    }
  };
  window.addEventListener("keydown", blindGalleryKeyHandler);
});

blindGalleryScreen.onExit(() => {
  if (blindGalleryKeyHandler) {
    window.removeEventListener("keydown", blindGalleryKeyHandler);
    blindGalleryKeyHandler = null;
  }
});
