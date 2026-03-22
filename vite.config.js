import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Servir a pasta assets em /assets (mesmos nomes de ficheiros, sem copiar) */
function serveAssetsPlugin() {
  return {
    name: "serve-assets",
    configureServer(server) {
      // Registar depois dos middlewares internos do Vite, para ?url / ?import em /assets
      // serem tratados pelo Vite antes do ficheiro estático.
      return () => {
        server.middlewares.use("/assets", (req, res, next) => {
          if (req.url && req.url.includes("?")) return next();
          const subpath = req.url.slice(1).split("?")[0] || "";
          const file = path.join(__dirname, "assets", subpath);
          if (!subpath || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
          const ext = path.extname(file).toLowerCase();
          const types = {
            ".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg", ".mov": "video/quicktime",
            ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
          };
          res.setHeader("Content-Type", types[ext] || "application/octet-stream");
          fs.createReadStream(file).pipe(res);
        });
      };
    },
  };
}

export default defineConfig({ plugins: [serveAssetsPlugin()] });
