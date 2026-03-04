import { Screen } from "../../src/core/Screen.js";
import { showSelectedVideo } from "../../src/core/video.js";

export let videoScreen = new Screen("video");

videoScreen.setLayout({
  align: { horizontal: "center", vertical: "top" },
  gap: 14,
});



videoScreen.onEnter((ctx) => {
  showSelectedVideo(ctx);
});
