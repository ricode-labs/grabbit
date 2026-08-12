# Agent Notes

## Commands
- Use npm; CI installs with `npm ci` and this repo has `package-lock.json`.
- Start the Electron app with `npm start` (`electron-forge start`). This launches main, preload, and renderer through the Forge Vite plugin.
- Verify TypeScript with `npm run typecheck`. This is the only pre-package check in CI.
- Lint with `npm run lint`; format TypeScript/TSX with `npm run format`.
- Build installers with `npm run make` on Linux/Windows. On macOS, run `npm run package` first, then build the `.pkg` from the generated `.app`. Linux Flatpak builds require Flatpak tooling like CI installs; macOS/Windows installer smoke checks only run on those OSes.

## App Shape
- Electron Forge wires `src/main/main.ts` as main, `src/preload/preload.ts` as preload, and `src/renderer/index.html`/`src/renderer/main.tsx` as the renderer via `forge.config.ts`.
- Main process owns aria2 startup/shutdown, preferences, tray, native window controls, protocol/file-open handling, and IPC handlers.
- Renderer code must call native/download APIs through `window.grabbit` and `window.aria2`; add or change IPC APIs in `src/preload/preload.ts`, `src/main/ipc.ts`, and the renderer/global types together.
- Shared IPC payload/result types live in `src/shared/types.ts`. Renderer import alias `@/*` maps only to `src/renderer/*`.

## aria2 Runtime
- Bundled binaries live under `resources/aria2` and are included in packages via `packagerConfig.extraResource`; supported packaged targets are linux x64, macOS arm64, and Windows x64.
- `src/main/paths.ts` chooses the aria2 binary by `process.platform`/`process.arch`; unsupported local architectures fail at runtime.
- aria2 RPC uses a random localhost port and random secret per app session. Do not hard-code RPC ports or tokens.
- aria2 state files, logs, trackers, DHT files, and preferences are stored under Electron `userData`; the default download directory is the OS Downloads folder plus `Grabbit`.
- `updateTrackers()` fetches trackers from jsDelivr at startup and then calls `aria2.changeGlobalOption`; startup behavior can depend on network availability.

## UI And Style
- Renderer UI uses React 19, Tailwind CSS v4 through `@tailwindcss/vite`, shadcn/base-nova config, and lucide icons.
- Prettier uses no semicolons, double quotes, LF endings, 2 spaces, and `prettier-plugin-tailwindcss` with `src/renderer/index.css` as the Tailwind stylesheet.
- ESLint disables `react-refresh/only-export-components` only for `src/renderer/components/ui/**/*` and `src/renderer/hooks/**/*`; keep reusable UI exports in those areas when that exception matters.

## Tests And CI
- There is no npm test script in this repo. For code changes, run at least `npm run typecheck`; add `npm run lint` when touching lint-sensitive code.
- After making code changes, perform a code review of the changed diff before reporting completion; call out findings or explicitly state that no issues were found, along with the verification performed.
- Release CI triggers on tags matching `v*` or manual dispatch, builds installers for linux-x64, macos-arm64, and windows-x64, then smoke-tests by launching the app and checking the matching `aria2c-*` process starts.
- Publish releases through GitHub Actions, not local installer builds. `gh` is installed locally and can be used for GitHub operations such as inspecting runs, releases, and dispatching workflows.
