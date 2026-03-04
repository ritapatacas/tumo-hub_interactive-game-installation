export function createSoundLevelWidget(theme) {
  function draw(p, s) {
    p.push();
    p.noStroke();
    p.fill(theme.colors.panelBg);
    p.rect(s.x, s.y, s.w, s.h, theme.radii.bar);

    p.fill(theme.colors.accent);
    p.rect(s.x, s.y, s.w * (s.level ?? 0), s.h, theme.radii.bar);

    p.fill(theme.colors.textMuted);
    p.textSize(theme.text.small);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text('Nível de som (placeholder)', s.x, s.y - 6);
    p.pop();
  }

  return { draw };
}
