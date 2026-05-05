import { Screen } from "../../src/core/Screen.js";

export const doorHomeScreen = new Screen("home");

doorHomeScreen.setLayout({
  gap: 10,
  maxWidth: "100%",
});

doorHomeScreen.setBackgroundImage({
  filename: "bg-01.png",
  size: "cover",
  position: "center center",
});

doorHomeScreen.beginShadowBox({ marginTop: 14, marginBottom: 33 });
doorHomeScreen.addText({ text: "Comunicação sob Pressão", variant: "title" });
doorHomeScreen.addText({
  text: "Portfólio Interativo de Jogos",
  variant: "hand",
  fontSize: "clamp(32px, 2.8vw, 42px)",
  color: "#56A0C1",
});
doorHomeScreen.endShadowBox();
