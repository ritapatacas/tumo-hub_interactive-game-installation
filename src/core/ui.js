import { resolveGalleryItems } from "./gallery.js";
import { spotlightIndexForTick } from "./gallerySpotlight.js";
import { createNoiseLevelWidget } from "./noiseLevel.js";
import { getTeam } from "./team.js";

export function buildCornerHintMarkup(buttons, { intro = "PRIME:", ariaLabel } = {}) {
  const lines = [`${intro}<br>`];
  for (const { color, label } of buttons) {
    lines.push(
      `<span class="ui-corner-hint-dot ui-corner-hint-dot--${color}" aria-hidden="true">⬤</span> ${label}<br>`
    );
  }
  const html = lines.join("");
  const fallbackAria = buttons.map((b) => b.label).join("; ");
  return { html, ariaLabel: ariaLabel ?? fallbackAria };
}

function css(v) {
  return v == null ? "" : `${v}`;
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function quizOptionDisplayLabel(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  if (/^[a-d]$/i.test(t)) return "";
  if (/^opção\s+[a-d]$/i.test(t)) return "";
  if (/^option\s+[a-d]$/i.test(t)) return "";
  const withoutLeading = t.replace(/^[a-d]\s*[\).\:\-–—]\s*/i, "").trim();
  if (withoutLeading !== t) return withoutLeading;
  return t;
}

function justifyFromVAlign(vAlign) {
  if (vAlign === "top") return "flex-start";
  if (vAlign === "bottom") return "flex-end";
  return "center";
}

function alignFromHAlign(hAlign) {
  if (hAlign === "left") return "flex-start";
  if (hAlign === "right") return "flex-end";
  return "center";
}

function textAlignFromHAlign(hAlign) {
  if (hAlign === "left") return "left";
  if (hAlign === "right") return "right";
  return "center";
}

function appendTextWithBoldSegments(container, text, strongWeight) {
  const s = text == null ? "" : String(text);
  const re = /\*\*\*([\s\S]*?)\*\*\*|\*\*([\s\S]*?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      container.appendChild(document.createTextNode(s.slice(last, m.index)));
    }
    const strong = document.createElement("strong");
    const inner = m[1] != null ? m[1] : m[2];
    strong.textContent = inner;
    if (strongWeight) strong.style.fontWeight = strongWeight;
    if (m[1] != null) strong.style.textDecoration = "underline";
    container.appendChild(strong);
    last = re.lastIndex;
  }
  if (last < s.length) {
    container.appendChild(document.createTextNode(s.slice(last)));
  }
}

export class UI {
  constructor({ mountEl, overlays, theme }) {
    this.mountEl = mountEl;
    this.overlays = overlays;
    this.theme = theme;

    this._actionRunner = null;
    this._inputs = new Map();
    this._noiseLevelDestroy = null;
    this._countdownInterval = null;
    this._countdownEl = null;
    this._teamScoreEl = null;
    this._teamIdentityEl = null;
    this._playerRoleBadgeEl = null;
    this._cornerHintBadgeEl = null;
    this._dockedMessageEl = null;
    this._dockedMessageTimer = null;
    this._gallerySpotlightInterval = null;

    this._screenEl = null;
    this._contentEl = null;
    this._containerStack = [];

    this.applyTheme(theme);
  }

  setActionRunner(fn) {
    this._actionRunner = fn;
  }

  applyTheme(theme) {
    const root = document.documentElement;
    const colors = theme?.colors ?? {};
    const mapping = {
      "--bg": colors.bg,
      "--text": colors.text,
      "--muted": colors.muted,
      "--card": colors.surface,
      "--border": colors.border,
      "--primary": colors.primary,
      "--danger": colors.danger,
      "--danger-text": colors.dangerText,
      "--input-bg": colors.inputBg,
      "--thumb-bg": colors.thumbBg,
      "--option-bg": colors.optionBg,
      "--sound-track-bg": colors.soundTrackBg,
    };

    for (const [k, v] of Object.entries(mapping)) {
      if (v) root.style.setProperty(k, v);
    }

    if (theme?.fontFamily) root.style.setProperty("--font", theme.fontFamily);
    if (theme?.text?.titleSize) root.style.setProperty("--title-size", theme.text.titleSize);

    const quiz = theme?.quiz;
    if (quiz?.question) {
      if (quiz.question.color) root.style.setProperty("--quiz-question-color", quiz.question.color);
      if (quiz.question.fontSize) root.style.setProperty("--quiz-question-font-size", quiz.question.fontSize);
    }
    const aspect = quiz?.aspect;
    if (aspect?.optionsBg) root.style.setProperty("--quiz-option-bg", aspect.optionsBg);
    if (Array.isArray(quiz?.options)) {
      quiz.options.forEach((opt, i) => {
        if (opt?.color) root.style.setProperty(`--quiz-option-${i}-color`, opt.color);
        const bg = opt?.backgroundColor ?? aspect?.optionsBg;
        if (bg) root.style.setProperty(`--quiz-option-${i}-bg`, bg);
      });
    }
    if (aspect) {
      if (aspect.afterTitle) root.style.setProperty("--quiz-gap-after-title", aspect.afterTitle);
      if (aspect.afterQuestion) root.style.setProperty("--quiz-gap-after-question", aspect.afterQuestion);
      if (aspect.betweenOptions) root.style.setProperty("--quiz-gap-between-options", aspect.betweenOptions);
    }
  }

  clear() {
    this._inputs.clear();
    if (this._noiseLevelDestroy) {
      this._noiseLevelDestroy();
      this._noiseLevelDestroy = null;
    }
    if (this._countdownInterval) {
      clearInterval(this._countdownInterval);
      this._countdownInterval = null;
    }
    if (this._countdownEl) {
      this._countdownEl.remove();
      this._countdownEl = null;
    }
    if (this._teamScoreEl) {
      this._teamScoreEl.remove();
      this._teamScoreEl = null;
    }
    if (this._teamIdentityEl) {
      this._teamIdentityEl.remove();
      this._teamIdentityEl = null;
    }
    if (this._playerRoleBadgeEl) {
      this._playerRoleBadgeEl.remove();
      this._playerRoleBadgeEl = null;
    }
    if (this._cornerHintBadgeEl) {
      this._cornerHintBadgeEl.remove();
      this._cornerHintBadgeEl = null;
    }
    if (this._dockedMessageTimer) {
      clearTimeout(this._dockedMessageTimer);
      this._dockedMessageTimer = null;
    }
    if (this._dockedMessageEl) {
      this._dockedMessageEl.remove();
      this._dockedMessageEl = null;
    }
    if (this._gallerySpotlightInterval) {
      clearInterval(this._gallerySpotlightInterval);
      this._gallerySpotlightInterval = null;
    }
    this._screenEl = null;
    this._contentEl = null;
    this._containerStack = [];
    this.overlays.clear();
  }

  setScreenBackgroundImage({ filename, url, size = "cover", position = "center center", repeat = "no-repeat", color } = {}) {
    const screen = this._screenEl;
    if (!screen) return;

    let src = url;
    if (!src && filename) src = "/assets/images/" + filename;

    if (!src) {
      screen.style.backgroundImage = "";
      if (color) screen.style.backgroundColor = color;
      return;
    }

    screen.style.backgroundImage = `url("${src}")`;
    screen.style.backgroundSize = size;
    screen.style.backgroundPosition = position;
    screen.style.backgroundRepeat = repeat;
    if (color) screen.style.backgroundColor = color;
  }

  beginScreen(layout = {}) {
    this.clear();

    const align = layout.align ?? {};
    const hAlign = align.horizontal ?? layout.hAlign ?? "center";
    let vAlign = align.vertical ?? layout.vAlign ?? "middle";
    if (vAlign === "center") vAlign = "middle";

    const screen = document.createElement("div");
    screen.className = "screen";

    const gapRaw = layout.gap ?? 14;
    const gapCss = typeof gapRaw === "number" ? `${gapRaw}px` : String(gapRaw);

    screen.style.display = "flex";
    screen.style.flexDirection = "column";
    screen.style.justifyContent = justifyFromVAlign(vAlign);
    screen.style.alignItems = alignFromHAlign(hAlign);
    screen.style.gap = gapCss;

    const content = document.createElement("div");
    content.className = "screen-content" + (layout.variant ? ` screen-content--${layout.variant}` : "");
    const maxWidth = layout.maxWidth ?? 720;
    content.style.width = "min(92vw, 100%)";
    content.style.maxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : `${maxWidth}`;
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = gapCss;
    content.style.alignItems = alignFromHAlign(hAlign);
    content.style.textAlign = textAlignFromHAlign(hAlign);
    if (layout.marginTop != null) {
      content.style.marginTop = typeof layout.marginTop === "number" ? layout.marginTop + "px" : String(layout.marginTop);
    }
    if (layout.marginBottom != null) {
      content.style.marginBottom = typeof layout.marginBottom === "number" ? layout.marginBottom + "px" : String(layout.marginBottom);
    }
    if (layout.marginLeft != null) {
      content.style.marginLeft = typeof layout.marginLeft === "number" ? layout.marginLeft + "px" : String(layout.marginLeft);
    }
    if (layout.marginRight != null) {
      content.style.marginRight = typeof layout.marginRight === "number" ? layout.marginRight + "px" : String(layout.marginRight);
    }

    if (layout.variant === "display") {
      screen.style.justifyContent = "flex-start";
      screen.style.alignItems = "center";
      const mw = layout.maxWidth;
      const widthStr =
        mw === undefined || mw === null ? "35vw" : typeof mw === "number" ? `${mw}px` : String(mw);
      content.style.width = widthStr;
      content.style.maxWidth = widthStr;
      const mh = layout.maxContentHeight;
      const heightStr =
        mh === undefined || mh === null ? "50vh" : typeof mh === "number" ? `${mh}px` : String(mh);
      content.style.height = heightStr;
      content.style.maxHeight = heightStr;
      content.style.overflowY = "auto";
      content.style.boxSizing = "border-box";
    }

    screen.appendChild(content);
    this.overlays.root.appendChild(screen);

    this._screenEl = screen;
    this._contentEl = content;

    if (document.body.dataset.interface !== "door") {
      const role = document.body.dataset.role === "p1" ? "p1" : "p2";
      const badge = document.createElement("div");
      badge.className = "ui-player-role-badge";
      badge.textContent = role === "p1" ? "PLAYER 1" : "PLAYER 2";
      badge.setAttribute("aria-label", badge.textContent);
      document.body.appendChild(badge);
      this._playerRoleBadgeEl = badge;
    }
  }

  /**
   * Dica no canto inferior esquerdo. `text` é texto simples (`\n` → quebra com `white-space: pre-line`).
   * Se `html` estiver definido (string não vazia após trim), usa `innerHTML` em vez de `text` (ex.: spans com cor).
   * Omitir ambos ou vazios = não mostrar.
   * @param {{ text?: string, html?: string, ariaLabel?: string, className?: string, inline?: boolean }} opts
   *   Com `html`, define `ariaLabel` para acessibilidade (texto plano equivalente).
   *   `className` – classes extra no badge (ex.: `ui-corner-hint-badge--wide`).
   *   `inline` – se true, coloca a dica no contentor atual (ex.: dentro de `beginShadowBox`), em fluxo normal;
   *   por omissão fica `position: fixed` no canto inferior esquerdo do viewport.
   */
  setCornerHint({ text, html, ariaLabel, className, inline } = {}) {
    if (this._cornerHintBadgeEl) {
      this._cornerHintBadgeEl.remove();
      this._cornerHintBadgeEl = null;
    }
    const htmlStr = html != null ? String(html).trim() : "";
    const t = text == null ? "" : String(text).trim();
    if (!htmlStr && !t) return;

    const el = document.createElement("div");
    el.className = ["ui-corner-hint-badge", className, inline ? "ui-corner-hint-badge--inline" : ""]
      .filter(Boolean)
      .join(" ")
      .trim();
    el.setAttribute("aria-live", "polite");
    if (htmlStr) {
      el.innerHTML = htmlStr;
      el.setAttribute("aria-label", ariaLabel ?? "");
    } else {
      el.textContent = t;
      el.setAttribute("aria-label", ariaLabel ?? t);
    }
    if (inline) {
      this._ensureContent().appendChild(el);
    } else {
      document.body.appendChild(el);
    }
    this._cornerHintBadgeEl = el;
  }

  onResize() {}

  runAction(actionName, payload) {
    if (!actionName) return;
    if (!this._actionRunner) return;
    this._actionRunner(actionName, payload);
  }

  _ensureContent() {
    if (!this._contentEl) {
      this.beginScreen();
    }
    return this._containerStack.length > 0
      ? this._containerStack[this._containerStack.length - 1]
      : this._contentEl;
  }

  /**
   * Abre uma flex row: os próximos add* (button, text, etc.) ficam lado a lado até endFlexRow().
   * @param {{
   *   gap?: number,
   *   hGap?: number,
   *   justify?: "center" | "flex-start" | "flex-end" | "space-between",
   *   align?: "center" | "stretch"
   *   className?: string — classe extra no div da row (ex.: para CSS específico do ecrã).
   * }} opts
   *   gap – espaço vertical (e horizontal se `hGap` não for usado). Valor por omissão: 8.
   *   hGap – espaço horizontal entre colunas (flex sections); quando definido, `gap` é só row-gap.
   */
  beginFlexRow(opts = {}) {
    const row = document.createElement("div");
    row.className = opts.className
      ? `ui-flex-row ${opts.className}`
      : "ui-flex-row";
    row.style.display = "flex";
    row.style.flexDirection = "row";
    row.style.flexWrap = "wrap";
    const baseGap = typeof opts.gap === "number" ? opts.gap : 8;
    if (typeof opts.hGap === "number") {
      row.style.rowGap = baseGap + "px";
      row.style.columnGap = opts.hGap + "px";
    } else {
      row.style.gap = baseGap + "px";
    }
    row.style.justifyContent = opts.justify || "center";
    row.style.alignItems = opts.align || "center";
    this._ensureContent().appendChild(row);
    this._containerStack.push(row);
  }

  /** Fecha a flex row aberta por beginFlexRow(). */
  endFlexRow() {
    if (this._containerStack.length > 0) this._containerStack.pop();
  }

  /**
   * Coluna flexível para usar dentro de beginFlexRow(): empilha os próximos add* em
   * vertical, com alinhamento horizontal left | center | right. Por omissão, dentro
   * de uma row recebe flex 1 1 0% para formar colunas lado a lado (ex.: duas colunas).
   * @param {{
   *   align?: "left" | "center" | "right",
   *   justify?: "flex-start" | "center" | "flex-end" | "space-between",
   *   paddingRight?: number | string,
   *   gap?: number,
   *   flex?: number | string | false,
   *   className?: string,
   *   minWidth?: number | string,
   *   marginTop?: number | string,
   *   marginBottom?: number | string,
   *   marginLeft?: number | string,
   *   marginRight?: number | string,
   * }} opts
   *   flex – false desativa o crescimento; string/number passa direto a CSS flex.
   *   justify – eixo principal da coluna (vertical): p.ex. center para centrar o bloco na altura da célula (com row align stretch).
   *   minWidth – número em px ou valor CSS; evita minWidth:0 da row quando definido.
   */
  beginFlexSection(opts = {}) {
    const parent = this._ensureContent();
    const inFlexRow = parent.classList.contains("ui-flex-row");

    const section = document.createElement("div");
    section.className = opts.className
      ? `ui-flex-section ${opts.className}`
      : "ui-flex-section";

    const align = opts.align ?? "left";
    section.style.display = "flex";
    section.style.flexDirection = "column";
    section.style.justifyContent = opts.justify ?? "flex-start";
    const gap =
      typeof opts.gap === "number"
        ? opts.gap + "px"
        : this._contentEl
          ? this._contentEl.style.gap || "14px"
          : "14px";
    section.style.gap = gap;
    section.style.alignItems = alignFromHAlign(align);
    section.style.textAlign = textAlignFromHAlign(align);

    if (opts.flex === false) {
      section.style.flex = "0 0 auto";
    } else if (opts.flex != null && opts.flex !== true) {
      section.style.flex = typeof opts.flex === "number" ? String(opts.flex) : opts.flex;
    } else if (inFlexRow) {
      section.style.flex = "1 1 0%";
    }

    if (inFlexRow || (opts.flex != null && opts.flex !== false)) {
      if (opts.minWidth === undefined) {
        section.style.minWidth = "0";
      }
    }

    if (opts.minWidth !== undefined) {
      section.style.minWidth =
        typeof opts.minWidth === "number" ? opts.minWidth + "px" : String(opts.minWidth);
    }

    if (opts.paddingRight !== undefined) {
      section.style.paddingRight =
        typeof opts.paddingRight === "number" ? opts.paddingRight + "px" : String(opts.paddingRight);
    }

    const setSectionMargin = (v, prop) => {
      if (v === undefined) return;
      section.style[prop] = typeof v === "number" ? `${v}px` : String(v);
    };
    setSectionMargin(opts.marginTop, "marginTop");
    setSectionMargin(opts.marginBottom, "marginBottom");
    setSectionMargin(opts.marginLeft, "marginLeft");
    setSectionMargin(opts.marginRight, "marginRight");

    parent.appendChild(section);
    this._containerStack.push(section);
  }

  /** Fecha a secção aberta por beginFlexSection(). */
  endFlexSection() {
    if (this._containerStack.length > 0) this._containerStack.pop();
  }

  /**
   * Abre uma "shadow box": um card translúcido que agrupa vários elementos
   * (texto, botões, imagens, etc.) para criar contraste com a imagem de fundo.
   * Fechar com endShadowBox().
   * @param {{ padding?: number | string, radius?: string, background?: string, marginTop?: number | string, marginBottom?: number | string, dock?: "bottom-left" }} opts
   *   `dock: "bottom-left"` — caixa fixa no canto inferior esquerdo do viewport (fora do fluxo centrado do ecrã).
   */
  beginShadowBox(opts = {}) {
    const box = document.createElement("div");
    const dockBl = opts.dock === "bottom-left";
    box.className = "ui-shadow-box" + (dockBl ? " ui-shadow-box--dock-bl" : "");

    const themeRadius = this.theme?.radius?.md ?? "16px";
    const padding = opts.padding ?? 20;
    const radius = opts.radius ?? themeRadius;
    const background = opts.background ?? "rgba(0, 0, 0, 0.28)";

    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.gap = this._contentEl ? this._contentEl.style.gap || "14px" : "14px";
    box.style.padding = typeof padding === "number" ? padding + "px" : padding;
    if (!dockBl) {
      if (opts.marginTop !== undefined) {
        box.style.marginTop = typeof opts.marginTop === "number" ? opts.marginTop + "px" : String(opts.marginTop);
      }
      if (opts.marginBottom !== undefined) {
        box.style.marginBottom = typeof opts.marginBottom === "number" ? opts.marginBottom + "px" : String(opts.marginBottom);
      }
    }
    box.style.borderRadius = radius;
    box.style.backgroundColor = background;
    box.style.backdropFilter = "blur(1.5px)";
    box.style.boxShadow = "0 50px 125px rgba(0, 0, 0, 0.40)";

    const parent = dockBl ? this.overlays.root : this._ensureContent();
    parent.appendChild(box);
    this._containerStack.push(box);
  }

  endShadowBox() {
    if (this._containerStack.length > 0) this._containerStack.pop();
  }

  _createImageWrapElement({
    filename,
    size = 100,
    align = "center",
    slotAspectRatio,
    objectFit = "contain",
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
  } = {}) {
    if (!filename) return null;

    const wrap = document.createElement("div");
    wrap.className = "ui-image-wrap ui-image-wrap--" + (align === "left" ? "left" : align === "right" ? "right" : "center");
    if (slotAspectRatio) wrap.classList.add("ui-image-wrap--slot");

    const img = document.createElement("img");
    img.alt = filename;
    img.src = "/assets/images/" + filename;
    img.className = "ui-image";
    if (slotAspectRatio) {
      wrap.style.width = typeof size === "number" ? size + "%" : "100%";
      wrap.style.maxWidth = "100%";
      wrap.style.aspectRatio = slotAspectRatio;
      wrap.style.flexShrink = "0";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = objectFit;
      img.style.display = "block";
    } else {
      img.style.width = typeof size === "number" ? size + "%" : "100%";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
    }

    wrap.appendChild(img);

    const setMargin = (v, prop) => {
      if (v === undefined) return;
      wrap.style[prop] = typeof v === "number" ? `${v}px` : String(v);
    };
    setMargin(marginLeft, "marginLeft");
    setMargin(marginRight, "marginRight");
    setMargin(marginTop, "marginTop");
    setMargin(marginBottom, "marginBottom");

    return wrap;
  }

  addText({
    text,
    variant = "body",
    align,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    fontSize,
    paragraphGap,
    color,
    leadingImage,
  } = {}) {
    const raw = text ?? "";
    const useParagraphs = paragraphGap !== undefined;
    const paragraphs = useParagraphs
      ? raw
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : null;

    const el = document.createElement("div");
    if (!useParagraphs) {
      el.style.whiteSpace = "pre-line";
    }

    const sizes = this.theme?.text ?? {};
    const colors = this.theme?.colors ?? {};

    const isTitle = variant === "title";

    if (isTitle) {
      el.style.fontSize = "var(--title-size, 20px)";
      el.style.fontFamily = css(sizes.titleFontFamily ?? "var(--font)");
      el.style.fontWeight = "700";
      el.style.letterSpacing = "-0.02em";
      el.style.color = css(colors.text ?? "var(--text)");
      el.style.width = "100%";
      el.style.textAlign = "center";
      el.style.alignSelf = "stretch";
    } else if (variant === "muted") {
      el.style.fontSize = css(sizes.bodySize ?? "clamp(19px, 2.15vw, 30px)");
      el.style.fontFamily = css(sizes.bodyFontFamily ?? "'Jersey 15', system-ui, sans-serif");
      el.style.fontWeight = "400";
      el.style.lineHeight = "1.45";
      el.style.color = css(colors.muted ?? "var(--muted)");
    } else if (variant === "foreground") {
      el.style.fontSize = css(sizes.bodySize ?? "clamp(19px, 2.15vw, 30px)");
      el.style.fontFamily = "var(--font-sans)";
      el.style.fontWeight = "400";
      el.style.lineHeight = "1.45";
      el.style.color = "var(--ink)";
    } else if (variant === "hand") {
      el.style.fontSize = css(sizes.bodySize ?? "clamp(19px, 2.15vw, 30px)");
      el.style.fontFamily = "var(--font-hand)";
      el.style.fontWeight = "400";
      el.style.lineHeight = "1.45";
      el.style.color = "var(--ink)";
    } else {
      el.style.fontSize = css(sizes.bodySize ?? "clamp(19px, 2.15vw, 30px)");
      el.style.fontFamily = css(sizes.bodyFontFamily ?? "'Jersey 15', system-ui, sans-serif");
      el.style.fontWeight = "400";
      el.style.lineHeight = "1.45";
      el.style.color = css(colors.text ?? "var(--text)");
    }

    if (color !== undefined) {
      el.style.color = css(color);
    }

    if (fontSize !== undefined) {
      el.style.fontSize = typeof fontSize === "number" ? `${fontSize}px` : css(fontSize);
    }

    if (align === "top") {
      if (!isTitle) el.style.alignSelf = "flex-start";
    } else if (align === "bottom") {
      el.style.alignSelf = "stretch";
      el.style.marginTop = "auto";
    }

    if (marginTop !== undefined) {
      el.style.marginTop = typeof marginTop === "number" ? marginTop + "px" : marginTop;
    }
    if (marginBottom !== undefined) {
      el.style.marginBottom = typeof marginBottom === "number" ? marginBottom + "px" : marginBottom;
    }
    if (marginLeft !== undefined) {
      el.style.marginLeft = typeof marginLeft === "number" ? marginLeft + "px" : marginLeft;
    }
    if (marginRight !== undefined) {
      el.style.marginRight = typeof marginRight === "number" ? marginRight + "px" : marginRight;
    }

    const strongWeight = isTitle ? "800" : "700";
    const paraGap =
      useParagraphs &&
      (typeof paragraphGap === "number" ? `${paragraphGap}px` : css(paragraphGap));
    if (useParagraphs) {
      paragraphs.forEach((para, i) => {
        const block = document.createElement("div");
        block.style.whiteSpace = "pre-line";
        if (isTitle) {
          block.style.width = "100%";
          block.style.textAlign = "center";
        }
        if (i < paragraphs.length - 1) {
          block.style.marginBottom = paraGap;
        }
        appendTextWithBoldSegments(block, para, strongWeight);
        el.appendChild(block);
      });
    } else {
      appendTextWithBoldSegments(el, raw, strongWeight);
    }

    if (leadingImage?.filename) {
      if (!isTitle) {
        el.style.textAlign = "left";
        el.style.alignSelf = "stretch";
      }
      const row = document.createElement("div");
      row.className = "ui-text-leading";
      row.style.display = "flex";
      row.style.flexDirection = "row";
      row.style.alignItems = "flex-start";
      row.style.gap =
        typeof leadingImage.gap === "number" ? `${leadingImage.gap}px` : leadingImage.gap != null ? css(leadingImage.gap) : "12px";
      row.style.width = "100%";
      row.style.boxSizing = "border-box";
      row.style.minWidth = "0";

      const imgWrap = this._createImageWrapElement({
        filename: leadingImage.filename,
        size: leadingImage.size ?? 18,
        align: "left",
        slotAspectRatio: leadingImage.slotAspectRatio ?? "1 / 1",
        objectFit: leadingImage.objectFit ?? "contain",
        marginLeft: leadingImage.marginLeft,
        marginRight: leadingImage.marginRight,
        marginTop: leadingImage.marginTop,
        marginBottom: leadingImage.marginBottom,
      });
      if (!imgWrap) {
        this._ensureContent().appendChild(el);
        return;
      }
      el.style.flex = "1 1 0%";
      el.style.minWidth = "0";
      row.appendChild(imgWrap);
      row.appendChild(el);
      this._ensureContent().appendChild(row);
    } else {
      this._ensureContent().appendChild(el);
    }
  }

  /**
   * @param {{
   *   label?: string,
   *   action?: string,
   *   variant?: string,
   *   ariaLabel?: string,
   *   title?: string,
   *   className?: string,
   *   vAlign?: "top" | "bottom",
   *   hAlign?: "left" | "center" | "right",
   *   marginTop?: number | string,
   *   marginBottom?: number | string,
   * }} opts
   */
  addButton({
    label,
    action,
    variant = "primary",
    ariaLabel,
    title,
    className,
    vAlign,
    hAlign,
    marginTop,
    marginBottom,
  } = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label ?? "Button";

    btn.className = `btn btn-${variant}${className ? " " + className : ""}`;
    if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
    if (title) btn.title = title;
    btn.addEventListener("click", () => this.runAction(action));

    if (vAlign === "top") {
      btn.style.alignSelf = alignFromHAlign(hAlign ?? "left");
    } else if (vAlign === "bottom") {
      btn.style.alignSelf = alignFromHAlign(hAlign ?? "center");
      btn.style.marginTop = "auto";
    } else if (hAlign != null) {
      btn.style.alignSelf = alignFromHAlign(hAlign);
    }

    if (marginTop !== undefined) {
      btn.style.marginTop = typeof marginTop === "number" ? marginTop + "px" : marginTop;
    }
    if (marginBottom !== undefined) {
      btn.style.marginBottom = typeof marginBottom === "number" ? marginBottom + "px" : marginBottom;
    }

    this._ensureContent().appendChild(btn);
  }

  /**
   * Insere uma imagem. Ficheiro em assets/images. size em % e alinhamento.
   * @param {{ filename: string, size?: number, align?: "center" | "left" | "right", slotAspectRatio?: string, objectFit?: "contain" | "cover", marginLeft?: number | string, marginRight?: number | string, marginTop?: number | string, marginBottom?: number | string }} opts
   *   `slotAspectRatio` (ex. `"1 / 1"`): caixa com proporção fixa para trocar `filename` sem saltar o layout; a imagem encaixa com `object-fit`.
   *   Margens opcionais no contentor (útil p.ex. `marginRight` com `align: "right"` para afastar da borda).
   */
  addImage({
    filename,
    size = 100,
    align = "center",
    slotAspectRatio,
    objectFit = "contain",
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
  } = {}) {
    const wrap = this._createImageWrapElement({
      filename,
      size,
      align,
      slotAspectRatio,
      objectFit,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
    });
    if (!wrap) return;
    this._ensureContent().appendChild(wrap);
  }

  /**
   * @param {{ id?: string, placeholder?: string, actionOnEnter?: string, maxWidth?: number | string, align?: "stretch" | "center" | "left" | "right", fontSize?: number | string, color?: string }} opts
   *   `align` no eixo da shadow box / coluna: centra o campo quando é mais estreito que o contentor.
   */
  addInput({ id, placeholder = "", actionOnEnter, maxWidth, align = "stretch", fontSize, color } = {}) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;

    input.className = "input";
    if (color != null) {
      input.style.color = css(color);
    }
    if (fontSize != null) {
      input.style.fontSize = typeof fontSize === "number" ? `${fontSize}px` : String(fontSize);
    }
    if (maxWidth != null) input.style.maxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : String(maxWidth);
    if (align === "center") input.style.alignSelf = "center";
    else if (align === "left") input.style.alignSelf = "flex-start";
    else if (align === "right") input.style.alignSelf = "flex-end";
    else input.style.alignSelf = "stretch";

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && actionOnEnter) {
        e.preventDefault();
        e.stopPropagation();
        this.runAction(actionOnEnter);
      }
    });

    this._ensureContent().appendChild(input);
    if (id) this._inputs.set(id, input);
  }

  getInputValue(id) {
    return this._inputs.get(id)?.value ?? "";
  }

  async addGallery({
    columns = 3,
    items,
    onSelectAction = "",
    showThumbnails = true,
    interactive = onSelectAction !== "",
  } = {}) {
    let resolved = resolveGalleryItems(items);
    const grid = document.createElement("div");
    grid.className = "gallery-grid";
    grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`;

    for (const it of resolved) {
      const card = document.createElement(interactive ? "button" : "div");
      if (interactive) card.type = "button";
      card.className = `gallery-card ${interactive ? "gallery-card--interactive" : "gallery-card--passive"} ${showThumbnails ? "" : "gallery-card--blind"}`.trim();

      if (showThumbnails) {
        const img = document.createElement("img");
        img.alt = it.name ?? "thumbnail";
        if (it.thumbnail && typeof it.thumbnail === "string" && it.thumbnail.length > 0) {
          img.src = it.thumbnail;
        } else if (it.name) {
          img.src = `/assets/thumbnails/${it.name}.png`;
        } else {
          img.src = "";
        }
        img.className = "gallery-thumb";
        card.appendChild(img);
      }

      const title = document.createElement("div");
      title.textContent = it.name ?? "";
      title.className = "gallery-title";

      if (interactive) {
        card.addEventListener("click", () => this.runAction(onSelectAction, it));
      }

      card.appendChild(title);
      grid.appendChild(card);
    }

    this._ensureContent().appendChild(grid);
  }

  /**
   * Galeria com vídeo em destaque aleatório, mudando a cada segundo (sincronizado entre P1/P2
   * via `state.gallerySeed` + `state.galleryEpoch`, definidos ao entrar na galeria).
   * @param {{ columns?: number, items?: any[], variant?: "thumbnails" | "blind", state: object }} opts
   */
  addSpotlightGallery({ columns = 3, items, variant = "thumbnails", state } = {}) {
    if (!state) return;

    const resolved = resolveGalleryItems(items);
    if (this._gallerySpotlightInterval) {
      clearInterval(this._gallerySpotlightInterval);
      this._gallerySpotlightInterval = null;
    }

    const grid = document.createElement("div");
    grid.className = "gallery-grid gallery-grid--spotlight";
    grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`;

    const cards = [];
    for (let i = 0; i < resolved.length; i++) {
      const it = resolved[i];
      const card = document.createElement("div");
      const base =
        variant === "blind"
          ? "gallery-card gallery-card--passive gallery-card--blind gallery-card--spotlight-cell"
          : "gallery-card gallery-card--passive gallery-card--spotlight-cell";
      card.className = base;
      card.dataset.index = String(i);

      if (variant === "thumbnails") {
        const img = document.createElement("img");
        img.alt = it.name ?? "thumbnail";
        if (it.thumbnail && typeof it.thumbnail === "string" && it.thumbnail.length > 0) {
          img.src = it.thumbnail;
        } else if (it.name) {
          img.src = `/assets/thumbnails/${it.name}.png`;
        } else {
          img.src = "";
        }
        img.className = "gallery-thumb";
        card.appendChild(img);
      }

      grid.appendChild(card);
      cards.push(card);
    }

    this._ensureContent().appendChild(grid);

    let lastTick = -1;

    const applyTick = () => {
      const epoch = Number(state.galleryEpoch) || 0;
      const seed = Number(state.gallerySeed) || 0;
      const len = resolved.length;
      if (!epoch || len === 0) {
        cards.forEach((el) => el.classList.remove("gallery-card--spotlight"));
        return;
      }

      const tick = Math.floor((Date.now() - epoch) / 400);
      if (tick === lastTick) return;
      lastTick = tick;

      const idx = spotlightIndexForTick(seed, tick, len);
      state.gallerySpotlightIndex = idx;

      cards.forEach((el, i) => {
        el.classList.toggle("gallery-card--spotlight", i === idx);
      });
    };

    applyTick();
    this._gallerySpotlightInterval = setInterval(applyTick, 120);
  }

  /**
   * Adiciona um quiz com pergunta e opções. Ao escolher uma resposta, chama onAnswerAction
   * com payload: { isCorrect, chosenIndex, chosenText, correctIndex, question }.
   * optionsLayout: "list" (vertical) ou "grid" (2x2). Aparência: theme.quiz (question, options).
   * @param {{ question: string, options: string[], correctIndex: number, onAnswerAction?: string, optionsLayout?: "list" | "grid" }} opts
   */
  addQuiz({ question, options, correctIndex, onAnswerAction = "", optionsLayout = "list" } = {}) {
    const card = document.createElement("div");
    card.className = "quiz-card";

    const q = document.createElement("div");
    q.textContent = question ?? "";
    q.className = "quiz-question";
    q.id = "quiz-question";

    const list = document.createElement("div");
    list.className = "quiz-options";
    if (optionsLayout === "grid") {
      list.classList.add("quiz-options--grid");
    }

    (options ?? []).forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option quiz-option-" + idx;
      btn.id = "quiz-option-" + idx;

      const dot = document.createElement("span");
      dot.className = "quiz-option-dot";
      dot.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.className = "quiz-option-label";
      const displayLabel = quizOptionDisplayLabel(opt);
      label.textContent = displayLabel;
      btn.setAttribute("aria-label", displayLabel || `Opção ${idx + 1}`);

      btn.appendChild(dot);
      btn.appendChild(label);

      btn.addEventListener("click", () => {
        const payload = {
          question,
          chosenIndex: idx,
          chosenText: opt,
          correctIndex,
          isCorrect: idx === correctIndex,
        };
        this.runAction(onAnswerAction, payload);
      });

      list.appendChild(btn);
    });

    card.appendChild(q);
    card.appendChild(list);

    this._ensureContent().appendChild(card);
  }

  /**
   * Simula o clique numa opção do quiz (útil para input externo, ex.: botões serial).
   * @param {number} optionIndex - índice da opção (0–3)
   */
  simulateQuizOptionClick(optionIndex) {
    const el = document.getElementById("quiz-option-" + optionIndex);
    if (el && typeof el.click === "function") {
      el.click();
    }
  }

  /**
   * Camada de abstração: procura no JSON (videosData) a pergunta do vídeo e mostra o quiz.
   * optionsLayout: "list" ou "grid" (2x2). Aparência via theme.quiz.
   * @param {{ videoId?: string, videosData?: Array<{ id: string, quiz?: Array<...> }>, onAnswerAction?: string, optionsLayout?: "list" | "grid" }} opts
   */
  addQuizForVideo(opts = {}) {
    const videosData = opts.videosData ?? [];
    let videoId = opts.videoId ?? "";
    let video = videoId ? videosData.find((v) => v.id === videoId) : null;
    if (!video) return;
    const questions = video?.quiz ?? [];
    const q =
      questions.length > 0
        ? questions[Math.floor(Math.random() * questions.length)]
        : null;
    if (!q) return;
    this.addQuiz({
      question: q.text,
      options: q.options ?? [],
      correctIndex: q.correctIndex ?? 0,
      onAnswerAction: opts.onAnswerAction ?? "",
      optionsLayout: opts.optionsLayout ?? "list",
    });
  }

  addSoundLevel({ level = 0.25 } = {}) {
    const outer = document.createElement("div");
    outer.className = "sound-outer";

    const inner = document.createElement("div");
    inner.className = "sound-inner";
    inner.style.width = `${clamp01(level) * 100}%`;

    outer.appendChild(inner);
    this._ensureContent().appendChild(outer);
  }

  addVideo({ src, autoplay = true, controls = true, onEndedAction = "" } = {}) {
    const video = document.createElement("video");
    video.src = src ?? "";
    video.autoplay = autoplay;
    video.controls = controls;
    video.className = "video";
    if (onEndedAction) {
      video.addEventListener("ended", () => this.runAction(onEndedAction));
    }

    this._ensureContent().appendChild(video);
  }

  addLeaderboard({ teams = [], slotCount = 10 } = {}) {
    const slots = Math.max(1, Math.min(100, Number(slotCount) || 10));
    const card = document.createElement("div");
    card.className = "leaderboard-card";

    const list = document.createElement("div");
    list.className = "leaderboard-list leaderboard-list--two-columns";

    const rows = [...teams];
    while (rows.length < slots) {
      rows.push({ name: "", points: null });
    }
    rows.splice(slots);

    rows.forEach((team, idx) => {
      const empty =
        !team ||
        (String(team.name ?? "").trim() === "" &&
          (team.points === null || team.points === undefined));
      const row = document.createElement("div");
      row.className = "leaderboard-row" + (empty ? " leaderboard-row--empty" : "");

      const rank = document.createElement("div");
      rank.className = "leaderboard-rank";
      rank.textContent = String(idx + 1).padStart(2, "0");

      const name = document.createElement("div");
      name.className = "leaderboard-name";
      name.textContent = empty ? "\u00a0" : team.name || "Equipa";

      const points = document.createElement("div");
      points.className = "leaderboard-points";
      points.textContent = empty ? "\u00a0" : `${Number(team.points || 0)} pts`;

      row.appendChild(rank);
      row.appendChild(name);
      row.appendChild(points);
      list.appendChild(row);
    });

    card.appendChild(list);
    this._ensureContent().appendChild(card);
  }

  setupDefaultQuizScreen(state, opts = {}) {
    const team = getTeam(state);
    this.addTeamScore(team.name, team.points, { teamCode: team.code });

    this.beginFlexRow({ gap: 14, hGap: 8, justify: "center", align: "stretch" });
    this.beginFlexSection({ align: "left", flex: 1 });
    this.addQuizForVideo({
      videoId: state.selectedVideoId ?? "",
      videosData: state.videosData ?? [],
      onAnswerAction: opts.onAnswerAction ?? "quizAnswered",
      optionsLayout: opts.optionsLayout ?? "list",
    });
    this.endFlexSection();

    this.beginFlexSection({ align: "center", flex: false });
    this.addCountdownTimer({
      seconds: opts.countdownSeconds ?? 10,
      label: opts.countdownLabel ?? "Tempo",
      onCompleteAction: opts.timeoutAction ?? "quizTimeout",
    });
    this.addNoiseLevel({
      threshold: opts.threshold ?? 0.5,
      sensitivity: opts.sensitivity ?? 1,
      onLevelChange:
        typeof opts.onLevelChange === "function" ? (levels) => opts.onLevelChange(levels, state) : undefined,
      getSecondaryLevel:
        typeof opts.getSecondaryLevel === "function" ? () => opts.getSecondaryLevel(state) : undefined,
      onExceedAction: opts.noiseAction ?? "noisePenalty",
    });
    this.endFlexSection();
    this.endFlexRow();
  }

  addTeamScore(teamName, points, opts = {}) {
    if (this._teamScoreEl) this._teamScoreEl.remove();
    if (this._teamIdentityEl) this._teamIdentityEl.remove();
    const name = teamName?.trim() || "—";
    const code = String(opts.teamCode ?? "").trim().toUpperCase();
    const pts = Number(points);
    const toolbarButtons = opts.toolbarButtons;

    const setTeamIdentityParagraphs = (el, displayName, displayCode) => {
      el.replaceChildren();
      const pName = document.createElement("p");
      pName.textContent = displayName;
      el.appendChild(pName);
      const pCode = document.createElement("p");
      pCode.textContent = displayCode || "\u00a0";
      el.appendChild(pCode);
      el.setAttribute(
        "aria-label",
        displayCode ? `${displayName}, código ${displayCode}` : `${displayName}`
      );
    };

    const setTeamScoreParagraphs = (el, ptsVal) => {
      el.replaceChildren();
      const pPts = document.createElement("p");
      pPts.textContent = `${ptsVal} pts`;
      el.appendChild(pPts);
      el.setAttribute("aria-label", `${ptsVal} pontos`);
    };

    if (toolbarButtons && toolbarButtons.length > 0) {
      const stack = document.createElement("div");
      stack.className = "ui-team-score-stack";

      const identityEl = document.createElement("div");
      identityEl.className = "ui-team-identity";
      identityEl.setAttribute("aria-live", "polite");
      setTeamIdentityParagraphs(identityEl, name, code);
      stack.appendChild(identityEl);

      const scoreEl = document.createElement("div");
      scoreEl.className = "ui-team-score";
      scoreEl.setAttribute("aria-live", "polite");
      setTeamScoreParagraphs(scoreEl, pts);
      stack.appendChild(scoreEl);

      const toolbar = document.createElement("div");
      toolbar.className = "ui-team-score-toolbar";
      for (const b of toolbarButtons) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = b.label ?? "Button";
        const variant = b.variant ?? "primary";
        btn.className = `btn btn-${variant}`;
        const action = b.action;
        btn.addEventListener("click", () => this.runAction(action));
        toolbar.appendChild(btn);
      }
      stack.appendChild(toolbar);

      document.body.appendChild(stack);
      this._teamScoreEl = stack;
      this._teamIdentityEl = identityEl;
      return;
    }

    const identityEl = document.createElement("div");
    identityEl.className = "ui-team-identity";
    identityEl.setAttribute("aria-live", "polite");
    setTeamIdentityParagraphs(identityEl, name, code);
    document.body.appendChild(identityEl);
    this._teamIdentityEl = identityEl;

    const el = document.createElement("div");
    el.className = "ui-team-score";
    el.setAttribute("aria-live", "polite");
    setTeamScoreParagraphs(el, pts);
    document.body.appendChild(el);
    this._teamScoreEl = el;
  }

  /**
   * Mostra um aviso temporário (ex.: correto / errado no quiz).
   * @param {string} text
   * @param {{
   *   type?: 'success' | 'error' | 'info',
   *   duration?: number,
   *   html?: string,
   *   dock?: 'top-left',
   *   ariaLabel?: string,
   *   className?: string,
   *   boxClassName?: string — classes extra no contentor (ex.: variante visual da caixa).
   * }} opts
   *   Com `dock: 'top-left'` e `html`, usa caixa + badge estilo canto (Press Start 2P), fixo no viewport.
   */
  showMessage(text, opts = {}) {
    const htmlStr = opts.html != null ? String(opts.html).trim() : "";
    if (opts.dock === "top-left" && htmlStr) {
      if (this._dockedMessageTimer) {
        clearTimeout(this._dockedMessageTimer);
        this._dockedMessageTimer = null;
      }
      if (this._dockedMessageEl) {
        this._dockedMessageEl.remove();
        this._dockedMessageEl = null;
      }

      const duration = opts.duration ?? 2500;
      const themeRadius = this.theme?.radius?.md ?? "16px";
      const box = document.createElement("div");
      const extraBoxClass = opts.boxClassName != null ? String(opts.boxClassName).trim() : "";
      box.className = ["ui-shadow-box", "ui-shadow-box--dock-tl", extraBoxClass]
        .filter(Boolean)
        .join(" ")
        .trim();
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.gap = "14px";
      box.style.padding = "20px";
      box.style.borderRadius = themeRadius;
      box.style.boxShadow = "0 50px 125px rgba(0, 0, 0, 0.40)";
      if (!extraBoxClass) {
        box.style.backgroundColor = "rgba(0, 0, 0, 0.28)";
        box.style.backdropFilter = "blur(1.5px)";
      }

      const hint = document.createElement("div");
      hint.className = [
        "ui-corner-hint-badge",
        "ui-corner-hint-badge--inline",
        "ui-corner-hint-badge--wide",
        "ui-corner-hint-badge--dock-tl",
        opts.className,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      hint.innerHTML = htmlStr;
      hint.setAttribute("aria-live", "polite");
      hint.setAttribute("aria-label", opts.ariaLabel ?? "");

      box.appendChild(hint);
      this.overlays.root.appendChild(box);
      this._dockedMessageEl = box;
      this._dockedMessageTimer = setTimeout(() => {
        box.remove();
        if (this._dockedMessageEl === box) this._dockedMessageEl = null;
        this._dockedMessageTimer = null;
      }, duration);
      return;
    }

    const type = opts.type ?? "info";
    const duration = opts.duration ?? 2500;
    const el = document.createElement("div");
    el.className = `ui-toast ${type}`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  /**
   * Barra vertical de nível de ruído (microfone).
   * - sensitivity: regula o valor exibido (1 é o normal).
   * - onExceedAction: nome de uma ação a chamar quando há demasiado ruído.
   * - onExceed: callback opcional (sem argumentos) a chamar quando há demasiado ruído.
   * O threshold é tratado internamente (valor razoável por omissão).
   * @param {{ threshold?: number, sensitivity?: number, onExceedAction?: string, onExceed?: () => void, onLevelChange?: ({ localLevel: number, secondaryLevel: number, combinedLevel: number }) => void, getSecondaryLevel?: () => number }} opts
   */
  addNoiseLevel(opts = {}) {
    if (this._noiseLevelDestroy) {
      this._noiseLevelDestroy();
      this._noiseLevelDestroy = null;
    }
    const runAction = this.runAction.bind(this);
    const action = opts.onExceedAction ?? "";
    const onExceedCallback = typeof opts.onExceed === "function" ? opts.onExceed : null;
    const widget = createNoiseLevelWidget(this._ensureContent(), {
      threshold: opts.threshold ?? 0.5,
      sensitivity: opts.sensitivity ?? 1,
      onLevelChange: opts.onLevelChange,
      getSecondaryLevel: opts.getSecondaryLevel,
      onExceed: () => {
        if (onExceedCallback) onExceedCallback();
        if (action) runAction(action);
      },
    });
    this._noiseLevelDestroy = widget.destroy.bind(widget);
  }

  /**
   * Mesma árvore DOM que a barra de ruído, sem microfone — reserva espaço no layout até
   * addNoiseLevel() substituir (remove este shell no primeiro addNoiseLevel).
   */
  addNoiseLevelShell() {
    if (this._noiseLevelDestroy) {
      this._noiseLevelDestroy();
      this._noiseLevelDestroy = null;
    }
    const wrap = document.createElement("div");
    wrap.className = "noise-level-wrap noise-level-wrap--shell";
    wrap.setAttribute("aria-hidden", "true");
    const label = document.createElement("div");
    label.className = "noise-level-label";
    const outer = document.createElement("div");
    outer.className = "noise-level-outer";
    const inner = document.createElement("div");
    inner.className = "noise-level-inner";
    outer.appendChild(inner);
    wrap.appendChild(label);
    wrap.appendChild(outer);
    this._ensureContent().appendChild(wrap);
    this._noiseLevelDestroy = () => {
      wrap.remove();
      this._noiseLevelDestroy = null;
    };
  }

  addCountdownTimer({
    seconds = 30,
    label = "Tempo",
    onCompleteAction = "",
    showZero = true,
    dangerAlways = false,
  } = {}) {
    if (this._countdownInterval) {
      clearInterval(this._countdownInterval);
      this._countdownInterval = null;
    }
    if (this._countdownEl) {
      this._countdownEl.remove();
      this._countdownEl = null;
    }

    const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const el = document.createElement("div");
    el.className = "ui-quiz-countdown";

    const title = document.createElement("div");
    title.className = "ui-quiz-countdown-label";
    title.textContent = label;

    const value = document.createElement("div");
    value.className = "ui-quiz-countdown-value";
    el.appendChild(title);
    el.appendChild(value);

    this._ensureContent().appendChild(el);

    const endAt = Date.now() + totalSeconds * 1000;
    let isCompleted = false;
    const render = () => {
      const remainingMs = endAt - Date.now();
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
      const visibleRemaining = showZero ? remaining : Math.max(1, remaining);
      value.textContent = String(visibleRemaining);
      value.classList.toggle("is-danger", dangerAlways || remaining <= 5);
      if (remaining <= 0) {
        if (this._countdownInterval) clearInterval(this._countdownInterval);
        this._countdownInterval = null;
        if (!isCompleted) {
          isCompleted = true;
          if (onCompleteAction) this.runAction(onCompleteAction);
        }
      }
    };

    this._countdownEl = el;
    render();
    this._countdownInterval = setInterval(render, 250);
  }
}
