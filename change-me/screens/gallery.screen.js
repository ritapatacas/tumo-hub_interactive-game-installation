import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

export let galleryScreen = new Screen("gallery");

galleryScreen.setLayout({ gap: 0, vAlign: "top", variant: "display" });

galleryScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

/** P1: thumbnails, destaque aleatório a cada segundo (sem escolher). */
galleryScreen.addSpotlightGallery({
  columns: 3,
  variant: "thumbnails",
});

galleryScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);
});
