import type { ForgeConfig } from "@electron-forge/shared-types"
import { MakerSquirrel } from "@electron-forge/maker-squirrel"
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
    appBundleId: "io.github.ricodelabs.Grabbit",
    icon: "resources/icons/icon",
    extraResource: ["resources/aria2", "resources/icons"],
    extendInfo: {
      NSPrincipalClass: "AtomApplication",
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
      CFBundleURLTypes: [
        {
          CFBundleURLName: "Grabbit Protocol",
          CFBundleURLSchemes: ["grabbit"],
        },
      ],
    },
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      const packagePaths = [
        "node_modules/node-portmapping",
        "node_modules/registry-js",
      ]

      await Promise.all(
        packagePaths.map((packagePath) => {
          return copy(join(process.cwd(), packagePath), join(buildPath, packagePath))
        })
      )
    },
  },
  makers: [
    new MakerSquirrel({
      setupIcon: "resources/icons/icon.ico",
    }),
    new MakerFlatpak({
      options: {
        id: "io.github.ricodelabs.Grabbit",
        bin: "Grabbit",
        icon: {
          "16x16": "resources/icons/icon-16.png",
          "32x32": "resources/icons/icon-32.png",
          "64x64": "resources/icons/icon-64.png",
          "128x128": "resources/icons/icon-128.png",
          "256x256": "resources/icons/icon-256.png",
          "512x512": "resources/icons/icon-512.png",
        } as unknown as string,
        runtimeVersion: "25.08",
        files: [],
        finishArgs: [
          "--socket=wayland",
          "--socket=fallback-x11",
          "--share=ipc",
          "--device=dri",
          "--filesystem=home",
          "--filesystem=/tmp",
          "--share=network",
          "--talk-name=org.kde.StatusNotifierWatcher",
        ],
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
          "x-scheme-handler/grabbit",
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
