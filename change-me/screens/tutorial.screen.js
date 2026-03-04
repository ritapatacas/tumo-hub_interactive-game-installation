import { Screen } from "../../src/core/Screen.js";

export let tutorialScreen = new Screen("tutorial");

tutorialScreen.setLayout({ gap: 40 });

tutorialScreen.addText({text: "Como jogar?", variant: "title"});

tutorialScreen.addText({text: 
    "Player 1, fica á frente do ecrã principal.",
    variant: "body"
});
tutorialScreen.addText({text: 
    "Player 2, vai para a outra parte da sala.",
    variant: "body"
});

tutorialScreen.addText({text: 
    "Vai aparecer uma seleção de vídeos, cada vídeo vai ter uma/algumas pergunta(s) para responder por isso, Player 1, preste muita atenção.",
    variant: "body"
});

tutorialScreen.addText({text: 
    "Quando cada jogador estiver no seu lugar respectivo, pressione ''continuar''.",
    variant: "body"
});

tutorialScreen.addButton({ label: "Continuar", action: "goGallery" });

//colocar imagens pls :3
