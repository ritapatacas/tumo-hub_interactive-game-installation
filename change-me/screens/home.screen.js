import { Screen } from "../../src/core/Screen.js";

export let homeScreen = new Screen("home");

homeScreen.setLayout({ gap: 40 });

homeScreen.addText({text: "Portfólio interativo: Game Dev", variant: "title"});
homeScreen.addText({text: "Escolhe um nome para a tua equipa", variant: "muted"});
homeScreen.addInput({
  id: "teamName",
  placeholder: "Escreve o nome da equipa",
  actionOnEnter: "saveTeamName",
});


homeScreen.beginFlexRow({ gap: 12, justify: "center" });
homeScreen.addButton({ label: "Continuar", action: "saveTeamName" });
homeScreen.addButton({ label: "Ver leaderboard", action: "goLeaderboard" });
homeScreen.endFlexRow();

