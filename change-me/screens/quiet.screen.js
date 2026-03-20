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

quietScreen.beginFlexSection({ align: "right", gap: 1 });
quietScreen.addText({text: 
    "**Players 1 e 2**:\nJá não vão poder falar!",
    variant: "body",
    marginLeft: 60,
    marginRight: -20,
});
quietScreen.addText({text: 
    "Se forem apanhados serão descontados pontos!",
    variant: "body",
    marginLeft: 60,
    marginRight: -20,
});
quietScreen.endFlexSection();

quietScreen.beginFlexSection({ align: "left", gap: 0 });
quietScreen.addImage({ filename: "quiet.png", size: 60 });
quietScreen.endFlexSection();

quietScreen.beginFlexSection({ align: "left", gap: 0 });
quietScreen.addText({text: 
    "**Player 2**: a vitória está nas tuas mãos!\nTens 10 segundos para responder à pergunta.",
    variant: "body",
    marginRight: 50,
    marginLeft: -20,
    marginTop: 20,
});
quietScreen.endFlexSection();

quietScreen.endFlexRow();
quietScreen.addButton({ label: "Continuar", action: "goQuizNow" });

//colocar imagens pls :3
