import { spawn } from "node:child_process";
import fs from "node:fs";

const windowsCommandPrompt = "/mnt/c/Windows/System32/cmd.exe";

export function openWindowsBrowser(url: string): boolean {
  if (!fs.existsSync(windowsCommandPrompt)) {
    return false;
  }

  spawn(windowsCommandPrompt, ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
  }).unref();

  return true;
}
