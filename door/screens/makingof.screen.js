import { Screen } from "../../src/core/Screen.js";

const MAKINGOF_IMAGE_MS = 3000;
const makingofImages = Object.values(
  import.meta.glob("../../assets/images/makingof/*.{jpg,jpeg,png,webp,avif}", {
    eager: true,
    import: "default",
    query: "?url",
  })
).sort();

export const doorMakingofScreen = new Screen("door-makingof");
doorMakingofScreen.autoAdvanceMs = Math.max(MAKINGOF_IMAGE_MS, makingofImages.length * MAKINGOF_IMAGE_MS);

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function clearDoorMakingofSlideshow(state) {
  if (state.__doorMakingofSlideshowTimerId) {
    clearInterval(state.__doorMakingofSlideshowTimerId);
    state.__doorMakingofSlideshowTimerId = null;
  }
}

doorMakingofScreen.setLayout({
  gap: 0,
  maxWidth: "100%",
});

doorMakingofScreen.setBackgroundImage({
  filename: "bg-07.png",
  size: "cover",
  position: "center center",
});

doorMakingofScreen.addMountStep(({ ui, state }) => {
  clearDoorMakingofSlideshow(state);
  const screen = ui._screenEl;
  if (!screen || makingofImages.length === 0) return;

  let order = shuffled(makingofImages);
  let index = 0;

  const frame = document.createElement("div");
  frame.className = "door-makingof-slideshow";

  const img = document.createElement("img");
  img.className = "door-makingof-slideshow__image";
  img.alt = "Making of";
  frame.appendChild(img);
  screen.appendChild(frame);

  const showNextImage = () => {
    if (!document.body.contains(frame)) {
      clearDoorMakingofSlideshow(state);
      return;
    }
    if (index >= order.length) {
      order = shuffled(makingofImages);
      index = 0;
    }
    img.src = order[index];
    index += 1;
  };

  showNextImage();
  state.__doorMakingofSlideshowTimerId = setInterval(showNextImage, MAKINGOF_IMAGE_MS);
});
