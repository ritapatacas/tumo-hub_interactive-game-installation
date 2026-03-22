import { createApp } from "./app.js";
import { getSessionConfigFromUrl } from "./core/sessionSync.js";

const appEl = document.getElementById("app");
const sessionConfig = getSessionConfigFromUrl();
createApp(appEl, sessionConfig).catch((err) => {
  console.error(err);
  appEl.innerHTML = `<div style="padding: 24px; font-family: system-ui; color: #0b0f14;">
    <p><strong>Erro ao carregar a aplicação</strong></p>
    <p>${err?.message ?? String(err)}</p>
    <p style="margin-top: 16px; font-size: 14px; color: #666;">Certifica-te que estás a usar <code>npm run dev</code> e a abrir o URL que aparece no terminal (ex.: http://localhost:5173), não o ficheiro HTML diretamente.</p>
  </div>`;
});
