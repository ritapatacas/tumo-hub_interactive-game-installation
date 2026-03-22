import { Screen } from "../../src/core/Screen.js";
import { showSelectedVideo } from "../../src/core/video.js";

export let videoScreen = new Screen("video");

videoScreen.setLayout({
  align: { horizontal: "center", vertical: "top" },
  gap: 14,
});

videoScreen.setBackgroundImage({
  filename: "bg-03.png",
  size: "cover",
  position: "center center",
});

videoScreen.onEnter((ctx) => {
  showSelectedVideo(ctx, { onEndedAction: "videoEndedAdvance" });
});
