let port = null;
let reader = null;
let decoder = null;
let readLoopPromise = null;

const buttonListeners = new Set();

const LINE_TO_INDEX = { RED: 0, BLUE: 1, YELLOW: 2, WHITE: 3, GREEN: 4 };

export const serial = {
  isSupported() {
    return typeof navigator !== "undefined" && "serial" in navigator;
  },

  async connect(opts = {}) {
    if (!this.isSupported()) {
      throw new Error("Web Serial API não está disponível neste browser.");
    }
    if (port?.readable) {
      return;
    }
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: opts.baudRate ?? 9600 });

    decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();

    readLoopPromise = this._readLoop();
  },

  async disconnect() {
    try {
      if (reader) {
        await reader.cancel();
        reader = null;
      }
      if (decoder?.writable) {
        await decoder.writable.close();
      }
      if (port) {
        await port.close();
        port = null;
      }
      if (readLoopPromise) {
        await readLoopPromise;
        readLoopPromise = null;
      }
    } catch (e) {
      console.warn("Serial disconnect:", e);
    }
  },

  onButtonPress(callback) {
    if (typeof callback !== "function") return () => {};
    buttonListeners.add(callback);
    return () => buttonListeners.delete(callback);
  },

  _notifyButton(optionIndex) {
    buttonListeners.forEach((cb) => {
      try {
        cb(optionIndex);
      } catch (e) {
        console.warn("Serial button listener error:", e);
      }
    });
  },

  _parseLine(line) {
    const key = line.trim().toUpperCase();
    if (!key) return;
    const idx = LINE_TO_INDEX[key];
    if (idx === undefined) return;
    this._notifyButton(idx);
  },

  async _readLoop() {
    if (!reader) return;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = value ?? "";
        const lines = text.split("\n");
        for (const line of lines) {
          this._parseLine(line);
        }
      }
    } catch (e) {
      if (e?.name !== "NetworkError") {
        console.warn("Serial read loop:", e);
      }
    } finally {
      reader = null;
    }
  },
};
