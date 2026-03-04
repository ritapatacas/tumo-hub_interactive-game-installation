export class ScreenManager {
  constructor({ ui, actions, state, teamsStorageKey = "tumo_hub_teams" }) {
    this.ui = ui;
    this.actions = actions;
    this.state = state;
    this._teamsStorageKey = teamsStorageKey;
    this._screens = new Map();
    this._current = null;

    this.ui.setActionRunner((actionName, payload) => {
      const fn = this.actions[actionName];
      if (!fn) {
        console.warn(`Unknown action: ${actionName}`);
        return;
      }
      const persistTeams = () => {
        try {
          localStorage.setItem(this._teamsStorageKey, JSON.stringify(this.state.teams));
        } catch (e) {
          console.warn("Could not save teams to storage", e);
        }
      };
      fn({
        goTo: (name, p) => this.goTo(name, p),
        ui: this.ui,
        state: this.state,
        payload,
        actions: this.actions,
        persistTeams,
      });
    });
  }

  register(screen) {
    this._screens.set(screen.name, screen);
  }

  async goTo(name, payload) {
    const next = this._screens.get(name);
    if (!next) throw new Error(`Screen not found: ${name}`);

    const ctx = {
      goTo: (n, p) => this.goTo(n, p),
      ui: this.ui,
      state: this.state,
      payload,
    };

    if (this._current) await this._current.unmount(ctx);
    this._current = next;
    await this._current.mount(ctx);
  }

  draw(p) {
    if (!this._current) return;
    const ctx = { ui: this.ui, state: this.state };
    this._current.draw(p, ctx);
  }
}
