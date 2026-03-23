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
      maxWidth: 1080,
    };
  }

  /**
   * @param {{
   *   variant?: "display",
   *   hAlign?: "left" | "center" | "right",
   *   vAlign?: "top" | "middle" | "bottom" | "center",
   *   align?: { horizontal?: "left" | "center" | "right", vertical?: "top" | "middle" | "bottom" | "center" },
   *   gap?: number,
   *   maxWidth?: number | string,
   *   maxContentHeight?: number | string,
   *   marginTop?: number | string,
   *   marginBottom?: number | string,
   *   marginLeft?: number | string,
   *   marginRight?: number | string,
   * }} opts
   *   `variant: "display"` — `screen-content`: por omissão **60vw** / **60vh** (ajustável com `maxWidth` / `maxContentHeight`), **marginTop** `20vh`; centrado na horizontal, alinhado ao topo na vertical (evita saltos quando o countdown some).
   */
  setLayout(opts = {}) {
    this._layout = { ...this._layout, ...opts };
    if (this._layout.variant === "display") {
      if (opts.maxWidth === undefined) this._layout.maxWidth = "60vw";
      if (opts.maxContentHeight === undefined) this._layout.maxContentHeight = "60vh";
      if (opts.marginTop === undefined) this._layout.marginTop = "20vh";
    }
    return this;
  }

  /**
   * Dica no canto inferior direito (fixa ao viewport). `text` é texto simples (`\n` = nova linha);
   * opcionalmente `html` para conteúdo com marcação (ex.: cores); nesse caso usar `ariaLabel`.
   * Omitir ou string vazia para não mostrar.
   * @param {{ text?: string, html?: string, ariaLabel?: string, className?: string, inline?: boolean }} opts
   */
  setCornerHint(opts = {}) {
    this._steps.push(({ ui }) => ui.setCornerHint(opts));
    return this;
  }

  /**
   * Texto simples. Se opts.shadow === true, o texto é automaticamente
   * envolvido numa shadow box (beginShadowBox/endShadowBox).
   * @param {{
   *   text: string,
   *   variant?: string,
   *   shadow?: boolean,
   *   align?: "top" | "bottom",
   *   marginTop?: number | string,
   *   marginBottom?: number | string,
   *   marginLeft?: number | string,
   *   marginRight?: number | string,
   *   fontSize?: number | string,
   *   paragraphGap?: number | string,
   *   color?: string,
   * }} opts
   *   Com variant "title", o texto fica sempre centrado na horizontal; `align` é só vertical.
   *   Variant "body" (omissão): Jersey 15 (`theme.text.bodyFontFamily`).
   *   Variant "foreground": cor `var(--ink)`, fonte `var(--font-sans)` (style.css).
   *   Variant "hand": cor `var(--ink)`, fonte Geo (`var(--font-hand)`).
   *   `fontSize`: opcional; sobrescreve o tamanho da variant (número = px, ou valor CSS).
   *   `color`: opcional; sobrescreve a cor (ex. `var(--ink)`).
   *   `paragraphGap`: opcional; separadores de parágrafo são `\n\n` (ver `ui.addText`).
   *   Negrito: `**texto**`; negrito + sublinhado: `***texto***` (pode repetir no mesmo string).
   *   Novas linhas: usa `\n` no texto.
   *   `leadingImage`: opcional — `{ filename, size?, slotAspectRatio?, objectFit?, gap? }`; imagem à esquerda do texto numa fila (LTR).
   */
  addText(opts = {}) {
    if (opts.shadow) {
      const { shadow, ...rest } = opts;
      this._steps.push(({ ui }) => {
        ui.beginShadowBox();
        ui.addText(rest);
        ui.endShadowBox();
      });
    } else {
      this._steps.push(({ ui }) => ui.addText(opts));
    }
    return this;
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
   *   `vAlign`: `top` ou `bottom` (`bottom` usa `margin-top: auto`). Largura ao conteúdo.
   *   `hAlign`: horizontal no eixo cruzado da column flex; omissão: `left` com `top`, `center` com `bottom`.
   */
  addButton(opts) {
    this._steps.push(({ ui }) => ui.addButton(opts));
    return this;
  }

  /**
   * Insere uma imagem a partir de assets/images.
   * @param {{ filename: string, size?: number, align?: "center" | "left" | "right", slotAspectRatio?: string, objectFit?: "contain" | "cover", marginLeft?: number | string, marginRight?: number | string, marginTop?: number | string, marginBottom?: number | string }} opts
   *   filename – nome do ficheiro em assets/images (ex: "logo.png")
   *   size – largura em % do container (ex: 50)
   *   align – alinhamento: "center" (default), "left" ou "right"
   *   slotAspectRatio – ex. `"1 / 1"` para área fixa ao trocar imagem
   *   margin* – opcional; número = px, string = valor CSS (ex. `"2vw"`)
   */
  addImage(opts = {}) {
    this._steps.push(({ ui }) => ui.addImage(opts));
    return this;
  }

  /**
   * Agrupa os próximos elementos (botões, texto, etc.) numa flex row – ficam lado a lado.
   * Fechar com endFlexRow().
   * @param {{
   *   gap?: number,
   *   hGap?: number,
   *   justify?: "center" | "flex-start" | "flex-end" | "space-between",
   *   align?: "center" | "stretch",
   * }} opts
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

  /**
   * Coluna dentro de uma flex row: empilha elementos em vertical com alinhamento
   * à esquerda, centro ou direita. Útil para duas (ou mais) colunas lado a lado.
   * @param {{
   *   align?: "left" | "center" | "right",
   *   justify?: "flex-start" | "center" | "flex-end" | "space-between",
   *   paddingRight?: number | string,
   *   gap?: number,
   *   flex?: number | string | false,
   * }} opts
   */
  beginFlexSection(opts = {}) {
    this._steps.push(({ ui }) => ui.beginFlexSection(opts));
    return this;
  }

  /** Fecha a secção aberta por beginFlexSection(). */
  endFlexSection() {
    this._steps.push(({ ui }) => ui.endFlexSection());
    return this;
  }

  /**
   * Agrupa os próximos elementos num "shadow box": um card translúcido que
   * cria contraste com a imagem de fundo. Fechar com endShadowBox().
   * Tudo o que for adicionado entre beginShadowBox() e endShadowBox() fica
   * dentro da mesma caixa.
   * @param {{ padding?: number | string, radius?: string, background?: string, marginTop?: number | string, marginBottom?: number | string, dock?: "bottom-left" }} opts
   */
  beginShadowBox(opts = {}) {
    this._steps.push(({ ui }) => ui.beginShadowBox(opts));
    return this;
  }

  /** Fecha a shadow box aberta por beginShadowBox(). */
  endShadowBox() {
    this._steps.push(({ ui }) => ui.endShadowBox());
    return this;
  }

  /** @param {{ id?: string, placeholder?: string, actionOnEnter?: string, maxWidth?: number | string, align?: "stretch" | "center" | "left" | "right", fontSize?: number | string, color?: string }} opts */
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

  /**
   * Galeria com destaque aleatório sincronizado (variant: "thumbnails" | "blind").
   */
  addSpotlightGallery(opts = {}) {
    this._steps.push(({ ui, state }) =>
      ui.addSpotlightGallery({
        ...opts,
        items: opts.items && opts.items.length > 0 ? opts.items : state.videosData ?? [],
        state,
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
   * Leaderboard com equipas obtidas do state (útil para ordem correta dos elementos).
   * getTeams(state) deve devolver um array de { name, points }.
   */
  addLeaderboardFromState(getTeams) {
    this._steps.push(({ ui, state }) => ui.addLeaderboard({ teams: getTeams(state) }));
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

  /**
   * Passo extra no mount: `fn(ctx)` com ctx = { ui, state, goTo, payload }.
   */
  addMountStep(fn) {
    this._steps.push(fn);
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
