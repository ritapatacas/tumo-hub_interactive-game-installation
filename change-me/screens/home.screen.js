import { Screen } from "../../src/core/Screen.js";
import { serial } from "../../src/serial.js";

export let homeScreen = new Screen("home");

let homeSerialUnsub = null;

homeScreen.setLayout({ gap: 10 });

homeScreen.setBackgroundImage({
  filename: "bg-01.png",
  size: "cover",
  position: "center center",
});

homeScreen.beginShadowBox({ marginTop: 14, marginBottom: 33 });
homeScreen.addText({ text: "Portfólio interativo | Game Dev", variant: "title" });
homeScreen.endShadowBox();

homeScreen.addMountStep(({ ui }) => {
  const isP1 = document.body.dataset.role === "p1";

  if (homeSerialUnsub) {
    homeSerialUnsub();
    homeSerialUnsub = null;
  }

  if (serial.isSupported() && !isP1) {
    homeSerialUnsub = serial.onButtonPress((optionIndex) => {
      if (optionIndex === 4) {
        ui.runAction("saveTeamName");
      } else if (optionIndex === 1) {
        ui.runAction("goLeaderboard");
      }
    });
  }

  if (isP1) {
    ui.addText({
      text: "A aguardar por Player 2",
      marginTop: 30,
      variant: "body",
      fontSize: "clamp(22px, 2.5vw, 32px)",
    });
    return;
  }

  ui.beginShadowBox({ dock: "bottom-right" });
  ui.setCornerHint({
    html:
      'PRIME:<br><span class="ui-corner-hint-dot ui-corner-hint-dot--white" aria-hidden="true">⬤</span> PARA CONTINUAR<br><span class="ui-corner-hint-dot ui-corner-hint-dot--blue" aria-hidden="true" >⬤</span> LEADERBOARD',
    ariaLabel: "Press white button to continue, press blue button for leaderboard",
    className: "ui-corner-hint-badge--wide",
    inline: true,
  });
  ui.endShadowBox();

  ui.addText({
    text: "Escolhe um nome para a tua",
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

homeScreen.onExit(() => {
  if (homeSerialUnsub) {
    homeSerialUnsub();
    homeSerialUnsub = null;
  }
});
