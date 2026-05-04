function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n)));
}

export function createNoiseLevelWidget(container, opts = {}) {
  const threshold = clamp01(opts.threshold ?? 0.8);
  const sensitivity = Math.max(0.1, Number(opts.sensitivity) || 1);
  const onExceed = opts.onExceed ?? (() => {});

  const wrap = document.createElement("div");
  wrap.className = "noise-level-wrap";

  const label = document.createElement("div");
  label.className = "noise-level-label";

  const outer = document.createElement("div");
  outer.className = "noise-level-outer";

  const inner = document.createElement("div");
  inner.className = "noise-level-inner";
  outer.appendChild(inner);

  wrap.appendChild(label);
  wrap.appendChild(outer);
  container.appendChild(wrap);

  let stream = null;
  let audioContext = null;
  let analyser = null;
  let animationId = 0;
  let lastExceedTime = 0;
  const EXCEED_COOLDOWN_MS = 2000;

  function updateBar(level) {
    const displayed = clamp01(level * sensitivity);
    inner.style.height = `${displayed * 100}%`;
    if (displayed >= threshold && Date.now() - lastExceedTime >= EXCEED_COOLDOWN_MS) {
      lastExceedTime = Date.now();
      onExceed();
    }
  }

  function tick() {
    if (!analyser) {
      animationId = requestAnimationFrame(tick);
      return;
    }
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = data[i] - 128;
      sum += v * v;
    }
    const rms = data.length ? Math.sqrt(sum / data.length) / 128 : 0;
    updateBar(Math.min(1, rms * 1.5));
    animationId = requestAnimationFrame(tick);
  }

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
    } catch (e) {
      console.warn("NoiseLevel: mic access failed", e);
      updateBar(0);
    }
    tick();
  }

  start();

  return {
    destroy() {
      cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioContext) audioContext.close();
      wrap.remove();
    },
  };
}
