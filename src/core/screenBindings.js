import { serial } from "../serial.js";

function keyMatches(e, key) {
  if (key === "Enter") return e.key === "Enter";
  if (key.length === 1) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    return k === key.toLowerCase();
  }
  return e.key === key;
}

export function attachKeyToAction(ctx, key, action, opts = {}) {
  const { p1Only, p2Only, skipIfTyping = key.length === 1, when, preventDefault = true } = opts;
  if (p2Only && !ctx.isP2) return () => {};
  if (p1Only && !ctx.isP1) return () => {};
  const fn = (e) => {
    if (e.repeat) return;
    if (p1Only && !ctx.isP1) return;
    if (p2Only && !ctx.isP2) return;
    if (when && !when(ctx, e)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (skipIfTyping) {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      if (t && t.isContentEditable) return;
    }
    if (!keyMatches(e, key)) return;
    if (preventDefault) e.preventDefault();
    ctx.ui.runAction(action);
  };
  window.addEventListener("keydown", fn);
  return () => window.removeEventListener("keydown", fn);
}

export function attachSerialButtonToAction(ctx, index, action, opts = {}) {
  const { p1Only, p2Only } = opts;
  if (p2Only && !ctx.isP2) return () => {};
  if (p1Only && !ctx.isP1) return () => {};
  if (!serial.isSupported()) return () => {};
  const unsub = serial.onButtonPress((optionIndex) => {
    if (optionIndex !== index) return;
    if (p1Only && !ctx.isP1) return;
    if (p2Only && !ctx.isP2) return;
    ctx.ui.runAction(action);
  });
  return unsub;
}

let hearingPreloaded = false;

export function bindAttentionInput(ctx) {
  if (!hearingPreloaded) {
    hearingPreloaded = true;
    const pre = new Image();
    pre.src = "/assets/images/hearing.png";
  }
  const p2Video = ctx.isP2 && ctx.payload?.p2VideoListen;
  if (p2Video) {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      ctx.ui.runAction("videoEndedAdvance");
    };
    const keyFn = (e) => {
      if (e.repeat) return;
      if (e.key === "Tab") return;
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      go();
    };
    window.addEventListener("keydown", keyFn);
    const unsubSerial = serial.onButtonPress(() => go());
    return () => {
      window.removeEventListener("keydown", keyFn);
      unsubSerial();
    };
  }
  const enterFn = (e) => {
    if (e.key !== "Enter" || e.repeat) return;
    ctx.ui.runAction("advanceFromAttention");
  };
  window.addEventListener("keydown", enterFn);
  return () => window.removeEventListener("keydown", enterFn);
}

export function bindLeaderboardInput(ctx) {
  const fn = (e) => {
    if (e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
    if (t && t.isContentEditable) return;

    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const hasTeam = String(ctx.state.teamName ?? "").trim().length > 0;

    if (ctx.isP2 && k === "b") {
      e.preventDefault();
      ctx.ui.runAction(hasTeam ? "goGallery" : "goHome");
      return;
    }
    if (ctx.isP2 && k === "v" && hasTeam) {
      e.preventDefault();
      ctx.ui.runAction("endGameAndGoHome");
      return;
    }

    if (e.key === "Tab") return;
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
    ctx.ui.runAction("goHome");
  };
  window.addEventListener("keydown", fn);
  return () => window.removeEventListener("keydown", fn);
}

export function bindTutorialContinueKey(ctx) {
  let timeoutId = null;
  let keyHandler = null;
  timeoutId = window.setTimeout(() => {
    timeoutId = null;
    keyHandler = (e) => {
      if (e.key !== "Enter" || e.repeat) return;
      ctx.ui.runAction("goGallery");
    };
    window.addEventListener("keydown", keyHandler);
  }, 250);
  return () => {
    if (timeoutId != null) clearTimeout(timeoutId);
    if (keyHandler) window.removeEventListener("keydown", keyHandler);
  };
}
