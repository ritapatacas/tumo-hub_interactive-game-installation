import { Screen } from "../../src/core/Screen.js";

export let preGalleryScreen = new Screen("preGallery");

preGalleryScreen.setLayout({ gap: 0, vAlign: "top", variant: "display" });

preGalleryScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

preGalleryScreen.setCornerHint({ text: "Prima Enter para continuar" });

preGalleryScreen.addText({ text: "Na galeria", variant: "title", vAlign: "top", marginTop: "10.65vh" });

preGalleryScreen.beginFlexRow({
  gap: 0,
  hGap: 0,
  align: "stretch",
});

preGalleryScreen.beginFlexSection({ align: "center", flex: 4 });
preGalleryScreen.addMountStep(({ ui }) => {
  ui.addImage({
    filename: "attention.png",
    size: 50,
    slotAspectRatio: "1 / 1",
    align: "center",
  });
});
preGalleryScreen.endFlexSection();

preGalleryScreen.beginFlexSection({
  align: "left",
  flex: 6,
  justify: "center",
  paddingRight: "5%",
});

preGalleryScreen.addMountStep(({ ui }) => {
  const isP1 = document.body.dataset.role === "p1";
  const instructionsFontSize = "clamp(22px, 2.6vw, 36px)";
  ui.addText(
    isP1
      ? {
          text: "**Player 1:** vais ver todos os vídeos e escolher um. Diz ao **Player 2** o que procurar — ele só vê a grelha às cegas.",
          variant: "body",
          fontSize: instructionsFontSize,
        }
      : {
          text: "**Player 2:** a tua galeria está às cegas. Ouve o **Player 1** e prime **Enter** quando estiveres pronto para abrir a galeria.",
          variant: "body",
          fontSize: instructionsFontSize,
        }
  );
});
preGalleryScreen.endFlexSection();
preGalleryScreen.endFlexRow();

let preGalleryEnterKeyHandler = null;

preGalleryScreen.onEnter(({ ui }) => {
  preGalleryEnterKeyHandler = (e) => {
    if (e.key !== "Enter" || e.repeat) return;
    ui.runAction("goGallery");
  };
  window.addEventListener("keydown", preGalleryEnterKeyHandler);
});

preGalleryScreen.onExit(() => {
  if (preGalleryEnterKeyHandler) {
    window.removeEventListener("keydown", preGalleryEnterKeyHandler);
    preGalleryEnterKeyHandler = null;
  }
});
