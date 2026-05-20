import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Aria2Options } from "../shared/download-api"

export const defaultAria2Options = {
  "auto-save-interval": 10,
  "bt-detach-seed-only": true,
  "bt-enable-lpd": true,
  "bt-hash-check-seed": true,
  "bt-load-saved-metadata": true,
  "bt-max-peers": 128,
  "bt-prioritize-piece": "head",
  "bt-save-metadata": true,
  "bt-seed-unverified": true,
  "bt-tracker-connect-timeout": 10,
  "bt-tracker-timeout": 10,
  "check-certificate": false,
  "connect-timeout": 10,
  "content-disposition-default-utf8": true,
  continue: true,
  "disk-cache": "64M",
  "dht-entry-point": "dht.transmissionbt.com:6881",
  "disable-ipv6": true,
  "enable-dht": true,
  "enable-peer-exchange": true,
  "file-allocation": "none",
  "force-save": true,
  "http-accept-gzip": true,
  "max-file-not-found": 10,
  "max-tries": 0,
  "min-split-size": "1M",
  "no-file-allocation-limit": "64M",
  "peer-agent": "Transmission/3.00",
  "peer-id-prefix": "-TR3000-",
  "remote-time": true,
  "retry-wait": 10,
  "save-session-interval": 30,
  "summary-interval": 0,
  timeout: 10,
} as const satisfies Aria2Options

export const runtimeOnlyAria2OptionKeys = new Set([
  "conf-path",
  "enable-rpc",
  "input-file",
  "rpc-listen-all",
  "rpc-listen-port",
  "rpc-secret",
  "save-session",
])

export function getUserAria2ConfigPath(userDataPath: string) {
  return path.join(userDataPath, "aria2", "config.json")
}

export async function loadUserAria2Options(userDataPath: string) {
  try {
    const rawConfig = await readFile(
      getUserAria2ConfigPath(userDataPath),
      "utf8"
    )
    const parsedConfig = JSON.parse(rawConfig) as unknown

    if (!isAria2Options(parsedConfig)) {
      return {}
    }

    return removeRuntimeOnlyOptions(parsedConfig)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {}
    }

    throw error
  }
}

export async function saveUserAria2Options(
  userDataPath: string,
  options: Aria2Options
) {
  const configPath = getUserAria2ConfigPath(userDataPath)
  await mkdir(path.dirname(configPath), { recursive: true })
  await writeFile(
    configPath,
    `${JSON.stringify(removeRuntimeOnlyOptions(options), null, 2)}\n`,
    "utf8"
  )
}

export function mergeAria2Options(userOptions: Aria2Options) {
  return {
    ...defaultAria2Options,
    ...removeRuntimeOnlyOptions(userOptions),
  } satisfies Aria2Options
}

export function toAria2Args(options: Aria2Options) {
  return Object.entries(options).flatMap(([key, value]) => {
    if (value === undefined || value === null) {
      return []
    }

    return [`--${key}=${String(value)}`]
  })
}

function removeRuntimeOnlyOptions(options: Aria2Options) {
  return Object.fromEntries(
    Object.entries(options).filter(
      ([key]) => !runtimeOnlyAria2OptionKeys.has(key)
    )
  )
}

function isAria2Options(value: unknown): value is Aria2Options {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every(
    (item) =>
      item === null ||
      item === undefined ||
      ["boolean", "number", "string"].includes(typeof item)
  )
}
