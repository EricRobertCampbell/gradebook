import { cp } from "node:fs/promises";
import path from "node:path";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const nativeModules = ["better-sqlite3", "node-addon-api"];

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: ["./drizzle", "./images"],
    name: "Gradebook",
    executableName: "gradebook",
    icon: "images/icon",
  },
  rebuildConfig: {
    extraModules: ["better-sqlite3"],
  },
  makers: [
    new MakerSquirrel({
      name: "Gradebook",
      authors: "Eric Campbell",
      setupIcon: "images/icon.ico",
    }),
    new MakerZIP({}, ["win32", "darwin", "linux"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: "src/main/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    async packageAfterCopy(_config, buildPath) {
      await Promise.all(
        nativeModules.map(async (moduleName) => {
          await cp(
            path.resolve(process.cwd(), "node_modules", moduleName),
            path.resolve(buildPath, "node_modules", moduleName),
            { recursive: true },
          );
        }),
      );
    },
  },
};

export default config;
