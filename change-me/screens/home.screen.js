import { Screen } from "../../src/core/Screen.js";
import { serial } from "../../src/serial.js";

export let homeScreen = new Screen("home");

let homeSerialUnsub = null;
let homeKeyHandler = null;

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
      'PRIME:<br><span class="ui-corner-hint-dot ui-corner-hint-dot--white" aria-hidden="true">⬤</span> CONTINUAR<br><span class="ui-corner-hint-dot ui-corner-hint-dot--blue" aria-hidden="true" >⬤</span> LEADERBOARD',
    ariaLabel:
      "Prima o botão branco ou a tecla B para continuar; botão azul ou tecla L para o leaderboard",
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

homeScreen.onEnter(({ ui }) => {
  if (document.body.dataset.role === "p1") return;
  homeKeyHandler = (e) => {
    if (e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
    if (t && /** @type {HTMLElement} */ (t).isContentEditable) return;

    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "l") {
      e.preventDefault();
      ui.runAction("goLeaderboard");
      return;
    }
    if (k === "b") {
      e.preventDefault();
      ui.runAction("saveTeamName");
      return;
    }
  };
  window.addEventListener("keydown", homeKeyHandler);
});

homeScreen.onExit(() => {
  if (homeSerialUnsub) {
    homeSerialUnsub();
    homeSerialUnsub = null;
  }
  if (homeKeyHandler) {
    window.removeEventListener("keydown", homeKeyHandler);
    homeKeyHandler = null;
  }
});
