import { Screen } from "../../src/core/Screen.js";

export let homeScreen = new Screen("home");

homeScreen.setLayout({ gap: 10 });


homeScreen.setBackgroundImage({
  filename: "bg-01.png",
  size: "cover",
  position: "center center",
});

homeScreen.beginShadowBox({ marginTop: 124, marginBottom: 0 });
homeScreen.addText({ text: "Portfólio interativo\nGame Dev", variant: "title" });
homeScreen.endShadowBox();

homeScreen.beginShadowBox({ marginTop: 8, marginBottom: 0 });

homeScreen.addText({text: "Escolhe um nome para a tua", marginBottom: 0});
homeScreen.addInput({
  id: "teamName",
  placeholder: "equipa",
  actionOnEnter: "saveTeamName",
  maxWidth: 200,
  align: "center",
});

homeScreen.endShadowBox();

homeScreen.beginFlexRow({ gap: 12, justify: "center" });
homeScreen.addButton({ label: "Continuar", action: "saveTeamName" });
homeScreen.addButton({ label: "Ver leaderboard", action: "goLeaderboard" });
homeScreen.endFlexRow();
