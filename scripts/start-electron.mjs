import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureWslDisplay } from "./configure-wsl-display.mjs";

const DEVELOPMENT_API_PORT = 8787;

function freeDevelopmentApiPort() {
  try {
    execFileSync("fuser", ["-k", `${DEVELOPMENT_API_PORT}/tcp`], {
      stdio: "ignore",
    });
  } catch {
    try {
      const pids = execFileSync("lsof", ["-ti", `tcp:${DEVELOPMENT_API_PORT}`], {
        encoding: "utf8",
      }).trim();

      for (const pid of pids.split("\n").filter(Boolean)) {
        process.kill(Number(pid), "SIGTERM");
      }
    } catch {
      // The port is already free, or this environment cannot inspect it.
    }
  }
}

configureWslDisplay(process.env);
freeDevelopmentApiPort();

const forgeCli = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "electron-forge.cmd" : "electron-forge",
);

const child = spawn(forgeCli, process.argv.slice(2), {
  stdio: "inherit",
  env: process.env,
  windowsHide: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
