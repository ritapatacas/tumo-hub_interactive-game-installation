import { Screen } from "../../src/core/Screen.js";

export let quietScreen = new Screen("quiet");

quietScreen.setLayout({ gap: 30 });

quietScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

quietScreen.addText({text: "Chiu!", variant: "title"});

quietScreen.beginFlexRow({
    gap: 0,
    hGap: 0,
    align: "center",
});



quietScreen.beginFlexSection({ align: "left", gap: 0 });
quietScreen.addImage({ filename: "quiet.png", size: 40 });
quietScreen.endFlexSection();

quietScreen.beginFlexSection({ align: "left", gap: 0 });

quietScreen.addMountStep(({ ui }) => {
  const isP1 = document.body.dataset.role === "p1";
  if (isP1) {
    ui.addText({
      text: "Já não vão poder falar!\nSe forem apanhados serão descontados pontos!",
      variant: "body",
      marginLeft: -20,
      marginRight: 50,
    });
  } else {
    ui.addText({
      text: "Já não vão poder falar!\nSe forem apanhados serão descontados pontos!\n\nTens 10 segundos para responder à pergunta.",
      variant: "body",
      marginRight: 50,
      marginLeft: -20,
    });
  }
});
quietScreen.endFlexSection();
quietScreen.endFlexRow();

quietScreen.onEnter(({ ui }) => {
  ui.addCountdownTimer({
    seconds: 10,
    label: "Tempo",
    showZero: false,
    dangerAlways: true,
  });
});
