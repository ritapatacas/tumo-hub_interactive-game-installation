import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const syncEntry = path.join(rootDir, "server", "sync-server.mjs");

const children = [
  spawn(process.execPath, [syncEntry], {
    cwd: rootDir,
    stdio: "inherit",
  }),
  spawn(process.execPath, [viteBin, "--host"], {
    cwd: rootDir,
    stdio: "inherit",
  }),
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 100);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    if (signal) {
      shutdown(1);
      return;
    }
    if (typeof code === "number" && code !== 0) {
      shutdown(code);
    }
  });
}
