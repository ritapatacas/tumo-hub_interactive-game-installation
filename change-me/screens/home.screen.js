import { Screen } from "../../src/core/Screen.js";

export let homeScreen = new Screen("home");

homeScreen.setLayout({ gap: 10 });
homeScreen.setBackgroundImage({
  filename: "bg-01.png",
  size: "cover",
  position: "center center",
});

homeScreen.beginShadowBox({ marginTop: 14, marginBottom: 33 });
homeScreen.addText({ text: "Comunicação sob Pressão", variant: "title" });
homeScreen.endShadowBox();

homeScreen.addCornerHint({
  p2Only: true,
  buttons: [
    { color: "white", label: "CONTINUAR" },
    { color: "blue", label: "LEADERBOARD" },
  ],
  ariaLabel: "Prima o botão branco ou a tecla B para continuar; botão azul ou tecla L para o leaderboard",
});

homeScreen.addMountStep(({ ui, isP1 }) => {
  if (isP1) {
    ui.addText({
      text: "A aguardar por Player 2",
      marginTop: 30,
      variant: "body",
      fontSize: "clamp(22px, 2.5vw, 32px)",
    });
    return;
  }
  ui.addText({
    text: "Escolhe um nome para a tua equipa (ou escreve o teu código)",
    marginTop: 30,
    variant: "body",
    fontSize: "clamp(22px, 2.5vw, 32px)",
  });
  ui.addInput({
    id: "teamName",
    placeholder: "equipa",
    actionOnEnter: "saveTeamName",
    maxWidth: 360,
    align: "center",
  });
});

homeScreen.onKeyDown("l", "goLeaderboard", { p2Only: true });
homeScreen.onKeyDown("b", "saveTeamName", { p2Only: true });
homeScreen.onSerialButton(4, "saveTeamName", { p2Only: true });
homeScreen.onSerialButton(1, "goLeaderboard", { p2Only: true });
