export class Screen {
  constructor(name) {
    this.name = name;
    /** @type {Array<(ctx: any) => void | Promise<void>>} */
    this._steps = [];
    this._onEnter = null;
    this._onExit = null;

    this._layout = {
      hAlign: "center", // left | center | right
      vAlign: "middle", // top | middle | bottom
      gap: 14,
      maxWidth: 720,
    };
  }

  setLayout(opts = {}) {
    this._layout = { ...this._layout, ...opts };
    return this;
  }

  // Visual/UI steps (no coordinates; flow/stack layout)
  addText(opts) {
    this._steps.push(({ ui }) => ui.addText(opts));
    return this;
  }

  addButton(opts) {
    this._steps.push(({ ui }) => ui.addButton(opts));
    return this;
  }

  /**
   * Insere uma imagem a partir de assets/images.
   * @param {{ filename: string, size?: number, align?: "center" | "left" | "right" }} opts
   *   filename – nome do ficheiro em assets/images (ex: "logo.png")
   *   size – largura em % do container (ex: 50)
   *   align – alinhamento: "center" (default), "left" ou "right"
   */
  addImage(opts = {}) {
    this._steps.push(({ ui }) => ui.addImage(opts));
    return this;
  }

  /**
   * Agrupa os próximos elementos (botões, texto, etc.) numa flex row – ficam lado a lado.
   * Fechar com endFlexRow().
   * @param {{ gap?: number, justify?: "center" | "flex-start" | "flex-end" | "space-between", align?: "center" | "stretch" }} opts
   */
  beginFlexRow(opts = {}) {
    this._steps.push(({ ui }) => ui.beginFlexRow(opts));
    return this;
  }

  /** Fecha a flex row aberta por beginFlexRow(). */
  endFlexRow() {
    this._steps.push(({ ui }) => ui.endFlexRow());
    return this;
  }

  addInput(opts) {
    this._steps.push(({ ui }) => ui.addInput(opts));
    return this;
  }

  addGallery(opts = {}) {
    // If o aluno não passar items, usamos os vídeos carregados em state.videosData (de assets/data.json).
    this._steps.push(({ ui, state }) =>
      ui.addGallery({
        ...opts,
        items: opts.items && opts.items.length > 0 ? opts.items : state.videosData ?? [],
      })
    );
    return this;
  }

  addQuiz(opts) {
    this._steps.push(({ ui }) => ui.addQuiz(opts));
    return this;
  }

  /** Quiz por vídeo: o UI procura no JSON a pergunta e opções; ao responder chama onAnswerAction com { isCorrect, ... }. */
  addQuizForVideo(opts) {
    this._steps.push(({ ui }) => ui.addQuizForVideo(opts));
    return this;
  }

  addSoundLevel(opts) {
    this._steps.push(({ ui }) => ui.addSoundLevel(opts));
    return this;
  }

  addNoiseLevel(opts) {
    this._steps.push(({ ui }) => ui.addNoiseLevel(opts));
    return this;
  }

  addVideo(opts) {
    this._steps.push(({ ui }) => ui.addVideo(opts));
    return this;
  }

  addLeaderboard(opts) {
    this._steps.push(({ ui }) => ui.addLeaderboard(opts));
    return this;
  }

  /**
   * Define uma imagem de fundo para este ecrã (div .screen).
   * filename – nome em assets/images (ex.: "bg.png")
   * url – caminho absoluto/relativo opcional (tem prioridade sobre filename)
   */
  setBackgroundImage(opts = {}) {
    this._steps.push(({ ui }) => ui.setScreenBackgroundImage(opts));
    return this;
  }

  /**
   * Ajuda para os alunos: configura um ecrã de quiz \"standard\" com
   * pontuação, pergunta do vídeo atual, nível de ruído e botão voltar.
   */
  useDefaultQuiz(opts = {}) {
    this._steps.push(({ ui, state }) => ui.setupDefaultQuizScreen(state, opts));
    return this;
  }

  // Lifecycle hooks (optional)
  onEnter(fn) {
    this._onEnter = fn;
    return this;
  }

  onExit(fn) {
    this._onExit = fn;
    return this;
  }

  async mount(ctx) {
    ctx.ui.beginScreen(this._layout);
    for (const step of this._steps) {
      // eslint-disable-next-line no-await-in-loop
      await step(ctx);
    }
    if (this._onEnter) await this._onEnter(ctx);
  }

  async unmount(ctx) {
    if (this._onExit) await this._onExit(ctx);
    ctx.ui.clear();
  }

  draw(p, ctx) {
    // Not used in DOM-only version.
    void p;
    void ctx;
  }
}
