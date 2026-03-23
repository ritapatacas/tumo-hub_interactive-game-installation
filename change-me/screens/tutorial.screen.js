import { Screen } from "../../src/core/Screen.js";
import { getTeam } from "../../src/core/team.js";

const tutStepText = {
  variant: "hand",
  fontSize: "clamp(12px, 2.4vw, 26px)",
  paragraphGap: 9,
};

export let tutorialScreen = new Screen("tutorial");

tutorialScreen.setLayout({ gap: 0, maxWidth: 490, vAlign: "top", marginTop: "25vh" });

// --- Imagem de fundo ---
tutorialScreen.setBackgroundImage({
  filename: "bg-06.png",
  size: "cover",
  position: "center center",
});

tutorialScreen.addMountStep(({ ui }) => {
  if (document.body.dataset.role === "p1") {
    ui.setCornerHint({ text: "" });
    return;
  }
  ui.beginShadowBox({ dock: "bottom-left", radius: "3px" });
  ui.setCornerHint({
    html:
      'PRIME:<br><span class="ui-corner-hint-dot ui-corner-hint-dot--white" aria-hidden="true">⬤</span> PARA CONTINUAR',
    ariaLabel: "Prima o botão branco ou a tecla Enter para ir à galeria",
    className: "ui-corner-hint-badge--wide",
    inline: true,
  });
  ui.endShadowBox();
});

tutorialScreen.beginFlexRow({
  gap: 32,
  hGap: 340,
  align: "left",
});
tutorialScreen.addText({
  text: "Como jogar?",
  variant: "title",
  align: "top",
  color: "var(--ink)",
  marginTop: -20,
  marginBottom: 50,
});




tutorialScreen.beginFlexSection({ align: "left", gap: 14, marginTop: -20 });

const tutIcon = {
  size: 18,
  slotAspectRatio: "1 / 1",
  objectFit: "contain",
};

/** Ícones walk / attention têm mais “ar” no PNG — sobe mais para alinhar com a 1.ª linha. */
const tutIconTopTight = {
  ...tutIcon,
  marginTop: "calc(-0.42em - 6px)",
};

tutorialScreen.addText({
  text: "**Player 1** vai para o outro lado da sala e escolhe o vídeo da ronda.",
  leadingImage: { filename: "walk.png", ...tutIconTopTight },
  ...tutStepText,
});
tutorialScreen.addText({
  text: "**Player 1** vê o vídeo e descreve tudo ao **Player 2**.",
  leadingImage: { filename: "talk.png", ...tutIcon },
  ...tutStepText,
});
tutorialScreen.addText({
  text: "**Player 2** responde à pergunta com base no que o **Player 1** disse.",
  leadingImage: { filename: "hearing.png", ...tutIcon },
  ...tutStepText,
});
tutorialScreen.addText({
  text: "…sem fazer barulho.",
  leadingImage: { filename: "quiet.png", ...tutIcon, size: 13 },
  ...tutStepText,
});

tutorialScreen.endFlexSection();

tutorialScreen.endFlexRow();

let tutorialEnterKeyHandler = null;
let tutorialEnterListenerTimeout = null;

tutorialScreen.onEnter(({ ui, state }) => {
  const team = getTeam(state);
  ui.addTeamScore(team.name, team.points);

  if (tutorialEnterListenerTimeout) {
    clearTimeout(tutorialEnterListenerTimeout);
    tutorialEnterListenerTimeout = null;
  }
  /** Evita que o Enter usado no home para gravar o nome dispare logo `goGallery` neste ecrã. */
  tutorialEnterListenerTimeout = window.setTimeout(() => {
    tutorialEnterListenerTimeout = null;
    tutorialEnterKeyHandler = (e) => {
      if (e.key !== "Enter" || e.repeat) return;
      ui.runAction("goGallery");
    };
    window.addEventListener("keydown", tutorialEnterKeyHandler);
  }, 250);
});

tutorialScreen.onExit(() => {
  if (tutorialEnterListenerTimeout) {
    clearTimeout(tutorialEnterListenerTimeout);
    tutorialEnterListenerTimeout = null;
  }
  if (tutorialEnterKeyHandler) {
    window.removeEventListener("keydown", tutorialEnterKeyHandler);
    tutorialEnterKeyHandler = null;
  }
});
