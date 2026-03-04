export function createOverlays(mountEl) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  mountEl.appendChild(overlay);

  return {
    root: overlay,
    clear() {
      overlay.innerHTML = "";
    },
  };
}
