import { resolveGalleryItems } from "./gallery.js";
import { createNoiseLevelWidget } from "./noiseLevel.js";

function css(v) {
  return v == null ? "" : `${v}`;
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function justifyFromVAlign(vAlign) {
  if (vAlign === "top") return "flex-start";
  if (vAlign === "bottom") return "flex-end";
  return "center"; // middle
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

/** Segmentos `**como isto**` viram <strong>; resto fica texto puro (sem HTML). */
function appendTextWithBoldSegments(container, text, strongWeight) {
  const s = text == null ? "" : String(text);
  const re = /\*\*([\s\S]*?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      container.appendChild(document.createTextNode(s.slice(last, m.index)));
    }
    const strong = document.createElement("strong");
    strong.textContent = m[1];
    if (strongWeight) strong.style.fontWeight = strongWeight;
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

    this._screenEl = null;
    this._contentEl = null;
    /** @type {HTMLElement[]} pilha de containers abertos (flex rows, shadow boxes, etc.); os add* acrescentam ao topo */
    this._containerStack = [];

    this.applyTheme(theme);
  }

  setActionRunner(fn) {
    this._actionRunner = fn;
  }

  applyTheme(theme) {
    // Minimal: map theme.colors.* to CSS variables if provided.
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

    // Quiz: variáveis para customizar pergunta e opções (ids: quiz-question, quiz-option-0, …)
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
    this._screenEl = null;
    this._contentEl = null;
    this._containerStack = [];
    this.overlays.clear();
  }

  /**
   * Altera o fundo do ecrã atual para uma imagem.
   * filename – nome em assets/images (ex.: "bg.png")
   * url – caminho absoluto/relativo opcional (tem prioridade sobre filename)
   */
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
    // API dos alunos usa "center"; internamente continuamos a usar "middle"
    if (vAlign === "center") vAlign = "middle";

    const screen = document.createElement("div");
    screen.className = "screen";

    screen.style.display = "flex";
    screen.style.flexDirection = "column";
    screen.style.justifyContent = justifyFromVAlign(vAlign);
    screen.style.alignItems = alignFromHAlign(hAlign);
    screen.style.gap = `${layout.gap ?? 14}px`;

    const content = document.createElement("div");
    content.className = "screen-content";
    const maxWidth = layout.maxWidth ?? 720;
    content.style.width = "min(92vw, 100%)";
    content.style.maxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : `${maxWidth}`;
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = `${layout.gap ?? 14}px`;
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

    screen.appendChild(content);
    this.overlays.root.appendChild(screen);

    this._screenEl = screen;
    this._contentEl = content;
  }

  onResize() {
    // No-op (flex layout). Kept for API stability.
  }

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
   * }} opts
   *   gap – espaço vertical (e horizontal se `hGap` não for usado). Valor por omissão: 8.
   *   hGap – espaço horizontal entre colunas (flex sections); quando definido, `gap` é só row-gap.
   */
  beginFlexRow(opts = {}) {
    const row = document.createElement("div");
    row.className = "ui-flex-row";
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
   *   gap?: number,
   *   flex?: number | string | false,
   * }} opts
   *   flex – false desativa o crescimento; string/number passa direto a CSS flex.
   */
  beginFlexSection(opts = {}) {
    const parent = this._ensureContent();
    const inFlexRow = parent.classList.contains("ui-flex-row");

    const section = document.createElement("div");
    section.className = "ui-flex-section";

    const align = opts.align ?? "left";
    section.style.display = "flex";
    section.style.flexDirection = "column";
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
      section.style.minWidth = "0";
    }

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
   * @param {{ padding?: number | string, radius?: string, background?: string }} opts
   */
  beginShadowBox(opts = {}) {
    const box = document.createElement("div");
    box.className = "ui-shadow-box";

    const themeRadius = this.theme?.radius?.md ?? "16px";
    const padding = opts.padding ?? 20;
    const radius = opts.radius ?? themeRadius;
    const background = opts.background ?? "rgba(0, 0, 0, 0.28)";

    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.gap = this._contentEl ? this._contentEl.style.gap || "14px" : "14px";
    box.style.padding = typeof padding === "number" ? padding + "px" : padding;
    box.style.borderRadius = radius;
    box.style.backgroundColor = background;
    box.style.backdropFilter = "blur(1.5px)";
    box.style.boxShadow = "0 50px 125px rgba(0, 0, 0, 0.40)";

    this._ensureContent().appendChild(box);
    this._containerStack.push(box);
  }

  /** Fecha a shadow box aberta por beginShadowBox(). */
  endShadowBox() {
    if (this._containerStack.length > 0) this._containerStack.pop();
  }

  // ---------- Components ----------

  /**
   * @param {{
   *   text?: string,
   *   variant?: string,
   *   align?: "top" | "bottom",
   *   marginTop?: number | string,
   *   marginBottom?: number | string,
   *   marginLeft?: number | string,
   *   marginRight?: number | string,
   * }} opts
   *   variant "title": texto sempre centrado na horizontal; `align` só afecta a vertical.
   *   Usa `**texto**` para negrito (vários segmentos permitidos).
   *   Quebras de linha: caracteres `\n` no string (ex. template literals com Enter).
   */
  addText({ text, variant = "body", align, marginTop, marginBottom, marginLeft, marginRight } = {}) {
    const el = document.createElement("div");
    el.style.whiteSpace = "pre-line";

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
      el.style.fontSize = css(sizes.bodySize ?? "clamp(14px, 1.4vw, 18px)");
      el.style.color = css(colors.muted ?? "var(--muted)");
    } else {
      el.style.fontSize = css(sizes.bodySize ?? "clamp(14px, 1.4vw, 18px)");
      el.style.color = css(colors.text ?? "var(--text)");
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
    appendTextWithBoldSegments(el, text ?? "", strongWeight);

    this._ensureContent().appendChild(el);
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
   * @param {{ filename: string, size?: number, align?: "center" | "left" | "right" }} opts
   */
  addImage({ filename, size = 100, align = "center" } = {}) {
    if (!filename) return;

    const wrap = document.createElement("div");
    wrap.className = "ui-image-wrap ui-image-wrap--" + (align === "left" ? "left" : align === "right" ? "right" : "center");

    const img = document.createElement("img");
    img.alt = filename;
    img.src = "/assets/images/" + filename;
    img.className = "ui-image";
    img.style.width = typeof size === "number" ? size + "%" : "100%";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.display = "block";

    wrap.appendChild(img);
    this._ensureContent().appendChild(wrap);
  }

  addInput({ id, placeholder = "", actionOnEnter } = {}) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;

    input.className = "input";

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.runAction(actionOnEnter);
    });

    this._ensureContent().appendChild(input);
    if (id) this._inputs.set(id, input);
  }

  getInputValue(id) {
    return this._inputs.get(id)?.value ?? "";
  }

  async addGallery({ columns = 3, items, onSelectAction = "" } = {}) {
    let resolved = resolveGalleryItems(items);
    const grid = document.createElement("div");
    grid.className = "gallery-grid";
    grid.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, 1fr)`;

    for (const it of resolved) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.alt = it.name ?? "thumbnail";
      // Prefer explicit thumbnail URL; fall back to /assets/thumbnails/<name>.png
      if (it.thumbnail && typeof it.thumbnail === "string" && it.thumbnail.length > 0) {
        img.src = it.thumbnail;
      } else if (it.name) {
        img.src = `/assets/thumbnails/${it.name}.png`;
      } else {
        img.src = "";
      }
      img.className = "gallery-thumb";

      const title = document.createElement("div");
      title.textContent = it.name ?? "";
      title.className = "gallery-title";

      card.addEventListener("click", () => this.runAction(onSelectAction, it));

      card.appendChild(img);
      card.appendChild(title);
      grid.appendChild(card);
    }

    this._ensureContent().appendChild(grid);
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
      label.textContent = opt;

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
    if (!video && videosData.length > 0) {
      video = videosData[Math.floor(Math.random() * videosData.length)];
    }
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

  addLeaderboard({ teams = [] } = {}) {
    const card = document.createElement("div");
    card.className = "leaderboard-card";

    const list = document.createElement("div");
    list.className = "leaderboard-list";

    if (!teams || teams.length === 0) {
      const empty = document.createElement("div");
      empty.className = "leaderboard-empty";
      empty.textContent = "Ainda não há equipas com pontos.";
      list.appendChild(empty);
    } else {
      teams.forEach((team, idx) => {
        const row = document.createElement("div");
        row.className = "leaderboard-row";

        const rank = document.createElement("div");
        rank.className = "leaderboard-rank";
        rank.textContent = String(idx + 1).padStart(2, "0");

        const name = document.createElement("div");
        name.className = "leaderboard-name";
        name.textContent = team.name || "Equipa";

        const points = document.createElement("div");
        points.className = "leaderboard-points";
        points.textContent = `${Number(team.points || 0)} pts`;

        row.appendChild(rank);
        row.appendChild(name);
        row.appendChild(points);
        list.appendChild(row);
      });
    }

    card.appendChild(list);
    this._ensureContent().appendChild(card);
  }

  /**
   * Configuração \"standard\" do ecrã de quiz. optionsLayout: "list" | "grid" (2x2).
   * @param {any} state
   * @param {{ onAnswerAction?: string, noiseAction?: string, threshold?: number, sensitivity?: number, backAction?: string, backLabel?: string, optionsLayout?: "list" | "grid" }} opts
   */
  setupDefaultQuizScreen(state, opts = {}) {
    const team = state.teamName || "Equipa";
    const points = state.teams?.[team] ?? 0;
    this.addTeamScore(team, points);

    // Layout: quiz à esquerda e barra de ruído à direita.
    // Usa beginFlexRow/beginFlexSection para manter o fluxo correto dos add*.
    this.beginFlexRow({ gap: 14, justify: "center", align: "stretch" });
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
      onExceedAction: opts.noiseAction ?? "noisePenalty",
    });
    this.endFlexSection();
    this.endFlexRow();

    // Intencionalmente sem botão "Voltar" no ecrã de quiz.
  }

  /**
   * Mostra no canto superior direito a pontuação da equipa atual (floating, não interfere no layout).
   * @param {string} teamName
   * @param {number} points
   */
  addTeamScore(teamName, points) {
    if (this._teamScoreEl) this._teamScoreEl.remove();
    const el = document.createElement("div");
    el.className = "ui-team-score";
    el.style.color = css(this.theme?.colors?.muted ?? "var(--muted)");
    const name = teamName?.trim() || "—";
    const pts = Number(points);
    el.textContent = `${name}: ${pts} pts`;
    document.body.appendChild(el);
    this._teamScoreEl = el;
  }

  /**
   * Mostra um aviso temporário (ex.: correto / errado no quiz).
   * @param {string} text
   * @param {{ type?: 'success' | 'error' | 'info', duration?: number }} opts
   */
  showMessage(text, opts = {}) {
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
   * @param {{ sensitivity?: number, onExceedAction?: string, onExceed?: () => void }} opts
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
      threshold: 0.5,
      sensitivity: opts.sensitivity ?? 1,
      onExceed: () => {
        if (onExceedCallback) onExceedCallback();
        if (action) runAction(action);
      },
    });
    this._noiseLevelDestroy = widget.destroy.bind(widget);
  }

  /**
   * Timer simples (contagem regressiva) para colocar acima do noise level.
   * @param {{ seconds?: number, label?: string, onCompleteAction?: string, showZero?: boolean }} opts
   */
  addCountdownTimer({ seconds = 30, label = "Tempo", onCompleteAction = "", showZero = true } = {}) {
    // Clean any previous countdown instance.
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
      value.classList.toggle("is-danger", remaining <= 5);
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
