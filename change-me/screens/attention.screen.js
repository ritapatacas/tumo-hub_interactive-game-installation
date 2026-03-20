import { Screen } from "../../src/core/Screen.js";

export let attentionScreen = new Screen("attention");

attentionScreen.setLayout({ gap: 30 });

attentionScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

attentionScreen.addText({text: "Fica atento", variant: "title"});


attentionScreen.beginFlexRow({
    gap: 0,
    hGap: 0,
    align: "center",
});

attentionScreen.beginFlexSection({ align: "right", gap: 1 });


attentionScreen.addText({text: 
    "**Player 1**:\no vídeo começará dentro de momentos, descreve-o em muito detalhe ao **Player 2**",
    variant: "body",
    marginLeft: 50,
});
attentionScreen.endFlexSection();

attentionScreen.beginFlexSection({ align: "left", gap: 1 });
attentionScreen.addImage({ filename: "attention.png", size: 60 });
attentionScreen.endFlexSection();

attentionScreen.beginFlexSection({ align: "left", gap: 1 });

attentionScreen.addText({text: 
    "**Player 2**:\n ouve com muita atenção a descrição do **Player 1**.",
    variant: "body",
    marginRight: 50,
});
attentionScreen.endFlexSection();
attentionScreen.endFlexRow();

attentionScreen.onEnter(({ ui }) => {
  ui.addCountdownTimer({
    seconds: 5,
    label: "Tempo",
    showZero: false, // mostra 5 -> 1
  });
});



attentionScreen.addButton({ label: "Continuar", action: "goVideo" });

//colocar imagens pls :3
