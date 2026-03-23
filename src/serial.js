/**
 * Web Serial API – leitura de inputs de porta serial (ex.: Arduino).
 * Formato: uma linha por botão pressionado — "RED", "BLUE", "YELLOW", "WHITE" ou "GREEN".
 * Mapeamento para opções do quiz: RED→0, BLUE→1, YELLOW→2, WHITE→3. GREEN→4 (extra; ecrãs podem tratar à parte).
 */

let port = null;
let reader = null;
let decoder = null;
let readLoopPromise = null;

/** @type {Set<(index: number) => void>} */
const buttonListeners = new Set();

/** Linha do Arduino → índice da opção do quiz (0–3) ou 4 para GREEN (uso em ecrãs não-quiz) */
const LINE_TO_INDEX = { RED: 0, BLUE: 1, YELLOW: 2, WHITE: 3, GREEN: 4 };

export const serial = {
  /**
   * Verifica se a Web Serial API está disponível (Chrome/Edge).
   * @returns {boolean}
   */
  isSupported() {
    return typeof navigator !== "undefined" && "serial" in navigator;
  },

  /**
   * Abre a porta serial (pede ao utilizador escolher o dispositivo).
   * @param {{ baudRate?: number }} opts
   * @returns {Promise<void>}
   */
  async connect(opts = {}) {
    if (!this.isSupported()) {
      throw new Error("Web Serial API não está disponível neste browser.");
    }
    if (port?.readable) {
      console.log("[Serial] já ligado, a ignorar connect.");
      return; // já ligado
    }
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: opts.baudRate ?? 9600 });
    console.log("[Serial] porta aberta, baudRate:", opts.baudRate ?? 9600);

    decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();

    readLoopPromise = this._readLoop();
  },

  /**
   * Fecha a porta e para o loop de leitura.
   */
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

  /**
   * Regista um callback chamado quando um botão é pressionado.
   * @param {(optionIndex: number) => void} callback - índice: red=0, blue=1, yellow=2, white=3, green=4
   * @returns {() => void} função para remover o listener
   */
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
    console.log("[Serial] botão:", key, "→ opção (quiz):", idx);
    this._notifyButton(idx);
  },

  async _readLoop() {
    if (!reader) return;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = value ?? "";
        if (text) console.log("[Serial] raw chunk:", JSON.stringify(text));
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
