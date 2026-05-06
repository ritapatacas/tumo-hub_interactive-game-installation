export class ScreenManager {
  constructor({ ui, actions, state, teamsStorageKey = "tumo_hub_teams", onNavigateRequest, canRunAction, onPersistTeams }) {
    this.ui = ui;
    this.actions = actions;
    this.state = state;
    this._teamsStorageKey = teamsStorageKey;
    this._screens = new Map();
    this._current = null;
    this._onNavigateRequest = typeof onNavigateRequest === "function" ? onNavigateRequest : null;
    this._canRunAction = typeof canRunAction === "function" ? canRunAction : null;
    this._onPersistTeams = typeof onPersistTeams === "function" ? onPersistTeams : null;

    this.ui.setActionRunner((actionName, payload) => {
      if (this._canRunAction && !this._canRunAction(actionName, payload)) {
        return;
      }
      const fn = this.actions[actionName];
      if (!fn) {
        console.warn(`Unknown action: ${actionName}`);
        return;
      }
      const persistTeams = () => {
        if (this._onPersistTeams) {
          this._onPersistTeams(this.state.teams);
          return;
        }
        try {
          localStorage.setItem(this._teamsStorageKey, JSON.stringify(this.state.teams));
        } catch (e) {
          console.warn("Could not save teams to storage", e);
        }
      };
      const role = document.body.dataset.role === "p2" ? "p2" : "p1";
      fn({
        goTo: (name, p) => this.goTo(name, p, { source: "action" }),
        ui: this.ui,
        state: this.state,
        payload,
        actions: this.actions,
        persistTeams,
        screen: this._current?.name ?? null,
        isP1: role === "p1",
        isP2: role === "p2",
      });
    });
  }

  register(screen) {
    this._screens.set(screen.name, screen);
  }

  _screenCtx(payload) {
    const role = document.body.dataset.role === "p2" ? "p2" : "p1";
    return {
      goTo: (n, p) => this.goTo(n, p),
      ui: this.ui,
      state: this.state,
      payload,
      actions: this.actions,
      isP1: role === "p1",
      isP2: role === "p2",
    };
  }

  async _performGoTo(name, payload) {
    const next = this._screens.get(name);
    if (!next) throw new Error(`Screen not found: ${name}`);

    const ctx = this._screenCtx(payload);

    if (this._current) await this._current.unmount(ctx);
    this._current = next;
    await this._current.mount(ctx);
  }

  async goTo(name, payload, meta = {}) {
    if (this._onNavigateRequest) {
      return this._onNavigateRequest({
        name,
        payload,
        meta,
        perform: (targetName, targetPayload) => this._performGoTo(targetName, targetPayload),
      });
    }
    return this._performGoTo(name, payload);
  }

  draw(p) {
    if (!this._current) return;
    const role = document.body.dataset.role === "p2" ? "p2" : "p1";
    const ctx = {
      ui: this.ui,
      state: this.state,
      isP1: role === "p1",
      isP2: role === "p2",
    };
    this._current.draw(p, ctx);
  }
}
