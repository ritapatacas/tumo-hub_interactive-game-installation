import { Screen } from "../../src/core/Screen.js";

export let tutorialScreen = new Screen("tutorial");

tutorialScreen.setLayout({ gap: 0 });

// --- Imagem de fundo ---
tutorialScreen.setBackgroundImage({
    filename: "bg-04.png",
    size: "cover",
    position: "center center",
  });
tutorialScreen.addText({text: "Como jogar?", variant: "title", align: "top", marginTop: -180, marginBottom: 150});

tutorialScreen.beginFlexRow({
  gap: 32,
  hGap: 340,
  align: "left",
});

tutorialScreen.beginFlexSection({ align: "left", gap: 50 });

tutorialScreen.beginShadowBox();
tutorialScreen.addText({
  text: "**1**\nEquipa de dois jogadores:\n**cada jogador num lado diferente da sala.**",
  variant: "body",
});
tutorialScreen.endShadowBox();

tutorialScreen.beginShadowBox();
tutorialScreen.addText({
    text: "**3**\nQuando o vídeo terminar **não poderão comunicar.**",
    variant: "body",
  });
tutorialScreen.endShadowBox();

tutorialScreen.endFlexSection();


tutorialScreen.beginFlexSection({ align: "left", gap: 50 });

tutorialScreen.beginShadowBox();
tutorialScreen.addText({
    text: "**2**\n**Player 1:** vais assistir a um vídeo.\nÉ importante que prestes muita atenção e **comuniques tudo o que vês**.",
    variant: "body",
  });
tutorialScreen.endShadowBox();

tutorialScreen.beginShadowBox();
tutorialScreen.addText({
  text: "**4**\n**Player 2:** vais responder a uma pergunta com base no que o **Player 1** te disse.",
  variant: "body",
});
tutorialScreen.endShadowBox();

tutorialScreen.endFlexSection();

tutorialScreen.endFlexRow();
tutorialScreen.addButton({
  label: "Continuar",
  action: "goGallery",
  vAlign: "bottom",
  hAlign: "right",
  marginTop: 24,
});

//colocar imagens pls :3
