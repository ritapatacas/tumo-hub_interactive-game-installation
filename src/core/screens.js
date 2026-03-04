export class ScreenManager {
  constructor() {
    this.screens = new Map(); // name -> screen object
    this.current = null;
  }

  register(name, screen) {
    if (!name) throw new Error("Screen name is required");
    if (!screen) throw new Error("Screen object is required");
    this.screens.set(name, screen);
  }

  goTo(name, ctx = {}) {
    const next = this.screens.get(name);
    if (!next) throw new Error(`Unknown screen: ${name}`);

    if (this.current?.onExit) this.current.onExit(ctx);
    this.current = next;
    if (this.current?.onEnter) this.current.onEnter(ctx);
  }

  update(p) {
    if (this.current?.update) this.current.update(p);
  }

  draw(p) {
    if (this.current?.draw) this.current.draw(p);
  }
}
