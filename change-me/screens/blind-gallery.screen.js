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

blindGalleryScreen.addCornerHint({
  buttons: [{ color: "white", label: "CONTINUAR" }],
  ariaLabel: "Prima o botão branco para continuar",
});

blindGalleryScreen.addSpotlightGallery({
  columns: 3,
  rows: 2,
  variant: "blind",
});

blindGalleryScreen.onKeyDown("Enter", "loadSpotlightVideoFromGallery");
blindGalleryScreen.onKeyDown("a", "connectArduino");

blindGalleryScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points, { teamCode: team.code });
});
