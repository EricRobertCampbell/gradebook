import fs from "node:fs";
import path from "node:path";

const wslgRuntimeDir = "/mnt/wslg/runtime-dir";

export function configureWslDisplay(env = process.env) {
  if (process.platform !== "linux") {
    return env;
  }

  try {
    if (!fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft")) {
      return env;
    }
  } catch {
    return env;
  }

  if (!fs.existsSync(path.join(wslgRuntimeDir, "wayland-0"))) {
    return env;
  }

  env.XDG_RUNTIME_DIR = wslgRuntimeDir;
  env.WAYLAND_DISPLAY = "wayland-0";
  env.ELECTRON_OZONE_PLATFORM_HINT = "wayland";
  return env;
}
