import fs from "node:fs";
import path from "node:path";

const wslgRuntimeDir = "/mnt/wslg/runtime-dir";

export function isRunningOnWsl(): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  try {
    return fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
  } catch {
    return false;
  }
}

export function configureWslDisplay(): boolean {
  if (!isRunningOnWsl()) {
    return false;
  }

  if (fs.existsSync(path.join(wslgRuntimeDir, "wayland-0"))) {
    process.env.XDG_RUNTIME_DIR = wslgRuntimeDir;
    process.env.WAYLAND_DISPLAY = "wayland-0";
    process.env.ELECTRON_OZONE_PLATFORM_HINT ??= "wayland";
  }

  return true;
}
