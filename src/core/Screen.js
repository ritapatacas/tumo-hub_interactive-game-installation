import { buildCornerHintMarkup } from "./ui.js";
import { attachKeyToAction, attachSerialButtonToAction } from "./screenBindings.js";

export class Screen {
  constructor(name) {
    this.name = name;
    this._steps = [];
    this._onEnter = null;
    this._onExit = null;
    this._bindingFactories = [];
    this._bindingTeardowns = [];
    this._layout = {
      hAlign: "center",
      vAlign: "middle",
      gap: 14,
      maxWidth: 1080,
    };
  }

  setLayout(opts = {}) {
    this._layout = { ...this._layout, ...opts };
    if (this._layout.variant === "display") {
      if (opts.maxWidth === undefined) this._layout.maxWidth = "60vw";
      if (opts.maxContentHeight === undefined) this._layout.maxContentHeight = "60vh";
      if (opts.marginTop === undefined) this._layout.marginTop = "20vh";
    }
    return this;
  }

  setCornerHint(opts = {}) {
    this._steps.push(({ ui }) => ui.setCornerHint(opts));
    return this;
  }

  addCornerHint({
    p1Only,
    p2Only,
    buttons,
    intro,
    ariaLabel,
    radius = "3px",
    className = "ui-corner-hint-badge--wide",
  } = {}) {
    this._steps.push((ctx) => {
      if (p1Only && !ctx.isP1) return;
      if (p2Only && !ctx.isP2) return;
      const { html, ariaLabel: a } = buildCornerHintMarkup(buttons, { intro, ariaLabel });
      ctx.ui.beginShadowBox({ dock: "bottom-left", radius });
      ctx.ui.setCornerHint({ html, ariaLabel: a, className, inline: true });
      ctx.ui.endShadowBox();
    });
    return this;
  }

  addBinding(factory) {
    this._bindingFactories.push(factory);
    return this;
  }

  onKeyDown(key, action, opts = {}) {
    this._bindingFactories.push((ctx) => attachKeyToAction(ctx, key, action, opts));
    return this;
  }

  onSerialButton(index, action, opts = {}) {
    this._bindingFactories.push((ctx) => attachSerialButtonToAction(ctx, index, action, opts));
    return this;
  }

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

  addButton(opts) {
    this._steps.push(({ ui }) => ui.addButton(opts));
    return this;
  }

  addImage(opts = {}) {
    this._steps.push(({ ui }) => ui.addImage(opts));
    return this;
  }

  beginFlexRow(opts = {}) {
    this._steps.push(({ ui }) => ui.beginFlexRow(opts));
    return this;
  }

  endFlexRow() {
    this._steps.push(({ ui }) => ui.endFlexRow());
    return this;
  }

  beginFlexSection(opts = {}) {
    this._steps.push(({ ui }) => ui.beginFlexSection(opts));
    return this;
  }

  endFlexSection() {
    this._steps.push(({ ui }) => ui.endFlexSection());
    return this;
  }

  beginShadowBox(opts = {}) {
    this._steps.push(({ ui }) => ui.beginShadowBox(opts));
    return this;
  }

  endShadowBox() {
    this._steps.push(({ ui }) => ui.endShadowBox());
    return this;
  }

  addInput(opts) {
    this._steps.push(({ ui }) => ui.addInput(opts));
    return this;
  }

  addGallery(opts = {}) {
    this._steps.push(({ ui, state }) =>
      ui.addGallery({
        ...opts,
        items: opts.items && opts.items.length > 0 ? opts.items : state.videosData ?? [],
      })
    );
    return this;
  }

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

  addLeaderboardFromState(getTeams) {
    this._steps.push(({ ui, state }) => ui.addLeaderboard({ teams: getTeams(state) }));
    return this;
  }

  setBackgroundImage(opts = {}) {
    this._steps.push(({ ui }) => ui.setScreenBackgroundImage(opts));
    return this;
  }

  useDefaultQuiz(opts = {}) {
    this._steps.push(({ ui, state }) => ui.setupDefaultQuizScreen(state, opts));
    return this;
  }

  addMountStep(fn) {
    this._steps.push(fn);
    return this;
  }

  onEnter(fn) {
    this._onEnter = fn;
    return this;
  }

  onExit(fn) {
    this._onExit = fn;
    return this;
  }

  _teardownBindings() {
    for (let i = this._bindingTeardowns.length - 1; i >= 0; i -= 1) {
      try {
        this._bindingTeardowns[i]();
      } catch {
        /* ignore */
      }
    }
    this._bindingTeardowns = [];
  }

  async mount(ctx) {
    ctx.ui.beginScreen(this._layout);
    for (const step of this._steps) {
      await step(ctx);
    }
    if (this._onEnter) await this._onEnter(ctx);
    this._teardownBindings();
    for (const factory of this._bindingFactories) {
      const teardown = factory(ctx);
      if (typeof teardown === "function") this._bindingTeardowns.push(teardown);
    }
  }

  async unmount(ctx) {
    this._teardownBindings();
    if (this._onExit) await this._onExit(ctx);
    ctx.ui.clear();
  }

  draw(p, ctx) {
    void p;
    void ctx;
  }
}
