export function createQuizRenderer(theme) {
  // We'll compute option hit-boxes each frame to keep it simple.
  let optionRects = [];

  function draw(p, q) {
    optionRects = [];

    const x = q.x, y = q.y;
    const w = 520;
    const line = 22;

    p.push();
    p.fill(theme.colors.text);
    p.noStroke();
    p.textSize(theme.text.h2);
    p.textAlign(p.LEFT, p.TOP);
    p.text(q.question ?? '', x, y);

    const startY = y + line * 2.2;
    const btnW = 520;
    const btnH = 44;
    const gap = 10;

    p.textSize(theme.text.buttonSize);

    for (let i = 0; i < (q.options?.length ?? 0); i++) {
      const by = startY + i * (btnH + gap);
      const hovered = isInside(p.mouseX, p.mouseY, x, by, btnW, btnH);

      p.noStroke();
      p.fill(hovered ? theme.colors.buttonHover : theme.colors.button);
      p.rect(x, by, btnW, btnH, theme.radii.button);

      p.fill(theme.colors.buttonText);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(q.options[i], x + 14, by + btnH / 2);

      optionRects.push({ i, x, y: by, w: btnW, h: btnH });
    }

    p.pop();
  }

  function handleClick(mx, my, q) {
    for (const r of optionRects) {
      if (isInside(mx, my, r.x, r.y, r.w, r.h)) {
        const isCorrect = r.i === q.correctIndex;
        q.onAnswer?.({ index: r.i, isCorrect });
        return true;
      }
    }
    return false;
  }

  function isInside(px, py, x, y, w, h) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  return { draw, handleClick };
}
