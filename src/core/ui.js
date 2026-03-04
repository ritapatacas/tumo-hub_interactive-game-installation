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

export class UI {
  constructor({ mountEl, overlays, theme }) {
    this.mountEl = mountEl;
    this.overlays = overlays;
    this.theme = theme;

    this._actionRunner = null;
    this._inputs = new Map();
    this._noiseLevelDestroy = null;
    this._teamScoreEl = null;

    this._screenEl = null;
    this._contentEl = null;
    /** @type {HTMLElement[]} pilha de flex rows abertas; os add* acrescentam ao topo */
    this._flexStack = [];

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
    if (this._teamScoreEl) {
      this._teamScoreEl.remove();
      this._teamScoreEl = null;
    }
    this._screenEl = null;
    this._contentEl = null;
    this._flexStack = [];
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
    return this._flexStack.length > 0 ? this._flexStack[this._flexStack.length - 1] : this._contentEl;
  }

  /**
   * Abre uma flex row: os próximos add* (button, text, etc.) ficam lado a lado até endFlexRow().
   * @param {{ gap?: number, justify?: "center" | "flex-start" | "flex-end" | "space-between", align?: "center" | "stretch" }} opts
   */
  beginFlexRow(opts = {}) {
    const row = document.createElement("div");
    row.className = "ui-flex-row";
    row.style.display = "flex";
    row.style.flexDirection = "row";
    row.style.flexWrap = "wrap";
    row.style.gap = typeof opts.gap === "number" ? opts.gap + "px" : "8px";
    row.style.justifyContent = opts.justify || "center";
    row.style.alignItems = opts.align || "center";
    this._ensureContent().appendChild(row);
    this._flexStack.push(row);
  }

  /** Fecha a flex row aberta por beginFlexRow(). */
  endFlexRow() {
    if (this._flexStack.length > 0) this._flexStack.pop();
  }

  // ---------- Components ----------

  addText({ text, variant = "body" } = {}) {
    const el = document.createElement("div");
    el.textContent = text ?? "";

    const sizes = this.theme?.text ?? {};
    const colors = this.theme?.colors ?? {};

    if (variant === "title") {
      el.style.fontSize = css(sizes.titleSize ?? "clamp(24px, 3vw, 42px)");
      el.style.fontWeight = "700";
      el.style.letterSpacing = "-0.02em";
      el.style.color = css(colors.text ?? "var(--text)");
    } else if (variant === "muted") {
      el.style.fontSize = css(sizes.bodySize ?? "clamp(14px, 1.4vw, 18px)");
      el.style.color = css(colors.muted ?? "var(--muted)");
    } else {
      el.style.fontSize = css(sizes.bodySize ?? "clamp(14px, 1.4vw, 18px)");
      el.style.color = css(colors.text ?? "var(--text)");
    }

    this._ensureContent().appendChild(el);
  }

  addButton({ label, action, variant = "primary", ariaLabel, title, className } = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label ?? "Button";

    btn.className = `btn btn-${variant}${className ? " " + className : ""}`;
    if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
    if (title) btn.title = title;
    btn.addEventListener("click", () => this.runAction(action));

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

    this.addQuizForVideo({
      videoId: state.selectedVideoId ?? "",
      videosData: state.videosData ?? [],
      onAnswerAction: opts.onAnswerAction ?? "quizAnswered",
      optionsLayout: opts.optionsLayout ?? "list",
    });

    this.addNoiseLevel({
      threshold: opts.threshold ?? 0.5,
      sensitivity: opts.sensitivity ?? 1,
      onExceedAction: opts.noiseAction ?? "noisePenalty",
    });

    this.addButton({
      label: opts.backLabel ?? "Voltar",
      action: opts.backAction ?? "goGallery",
    });
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
}
