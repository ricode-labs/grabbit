import type { ForgeConfig } from "@electron-forge/shared-types"
import { MakerSquirrel } from "@electron-forge/maker-squirrel"
import { MakerDMG } from "@electron-forge/maker-dmg"
import { MakerFlatpak } from "@electron-forge/maker-flatpak"
import { VitePlugin } from "@electron-forge/plugin-vite"
import { FusesPlugin } from "@electron-forge/plugin-fuses"
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives"
import { FuseV1Options, FuseVersion } from "@electron/fuses"
import { copy } from "fs-extra"
import { join } from "node:path"

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: ["resources/aria2"],
    extendInfo: {
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: "BitTorrent File",
          CFBundleTypeRole: "Viewer",
          CFBundleTypeExtensions: ["torrent"],
          LSHandlerRank: "Alternate",
        },
        {
          CFBundleTypeName: "Metalink File",
          CFBundleTypeRole: "Viewer",
          CFBundleTypeExtensions: ["metalink", "meta4"],
          LSHandlerRank: "Alternate",
        },
      ],
    },
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      const packagePath = "node_modules/node-portmapping"
      await copy(join(process.cwd(), packagePath), join(buildPath, packagePath))
    },
  },
  makers: [
    new MakerSquirrel({}),
    new MakerDMG({}, ["darwin"]),
    new MakerFlatpak({
      options: {
        runtimeVersion: process.env.FLATPAK_RUNTIME_VERSION ?? "25.08",
        files: [],
        modules: [
          {
            name: "zypak",
            sources: [
              {
                type: "git",
                url: "https://github.com/refi64/zypak",
                tag: "v2025.09",
              },
            ],
          },
        ],
        mimeType: [
          "application/x-bittorrent",
          "application/metalink+xml",
          "application/metalink4+xml",
        ],
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main/main.ts",
          config: "vite.main.config.mts",
          target: "main",
        },
        {
          entry: "src/preload/preload.ts",
          config: "vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
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
}

export default config
