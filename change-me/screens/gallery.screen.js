import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

export let galleryScreen = new Screen("gallery");

galleryScreen.setLayout({
  align: { horizontal: "center", vertical: "top" },
  gap: 14,
});

galleryScreen.addGallery({
  columns: 3,
  onSelectAction: "openVideoFromGallery",
});
galleryScreen.beginFlexRow({ gap: 12 });
galleryScreen.addButton({ label: "Ligar Arduino", action: "connectArduino" });
galleryScreen.addButton({ label: "Quiz", action: "goQuiz" });
galleryScreen.addButton({ label: "Voltar", action: "goHome" });
galleryScreen.endFlexRow();

galleryScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);
});
