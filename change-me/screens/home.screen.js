import { Screen } from "../../src/core/Screen.js";

export let homeScreen = new Screen("home");

homeScreen.setLayout({ gap: 10 });
homeScreen.setBackgroundImage({
  filename: "bg-01.png",
  size: "cover",
  position: "center center",
});

homeScreen.beginShadowBox({ marginTop: 14, marginBottom: 33 });
homeScreen.addText({
  text: "COMUNICAÇÃO SOB PRESSÃO",
  variant: "title",
  fontSize: "clamp(44px, 6.4vw, 82px)",
  fontWeight: 500,
  letterSpacing: "0.03em",
});
homeScreen.addText({
  text: "Instalação Interativa de Jogos",
  variant: "hand",
  fontSize: "clamp(32px, 2.8vw, 42px)",
  color: "#56A0C1",
});
homeScreen.endShadowBox();

homeScreen.addCornerHint({
  p1Only: true,
  buttons: [
    { color: "white", label: "CONTINUAR" },
    { color: "blue", label: "LEADERBOARD" },
  ],
  ariaLabel: "Prima o botão branco ou a tecla B para continuar; botão azul ou tecla L para o leaderboard",
});

homeScreen.addMountStep(({ ui, isP2 }) => {
  if (isP2) {
    ui.addText({
      text: "A aguardar por Player 1",
      marginTop: 30,
      variant: "body",
      fontSize: "clamp(26px, 3vw, 38px)",
    });
    return;
  }
  ui.addText({
    text: "Escolhe um nome para a tua equipa (ou escreve o teu código)",
    marginTop: 20,
    variant: "body",
    fontSize: "clamp(26px, 3vw, 38px)",
  });
  ui.addInput({
    id: "teamName",
    placeholder: "equipa",
    actionOnEnter: "saveTeamName",
    maxWidth: 360,
    align: "center",
  });
});

homeScreen.onKeyDown("l", "goLeaderboard", { p1Only: true });
homeScreen.onKeyDown("b", "saveTeamName", { p1Only: true });
homeScreen.onSerialButton(4, "saveTeamName", { p1Only: true });
homeScreen.onSerialButton(1, "goLeaderboard", { p1Only: true });
