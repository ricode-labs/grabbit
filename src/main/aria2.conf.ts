import {
  buildGlobalAria2Options,
  buildSchedulerGlobalOptions,
  type GrabbitPreferences,
  type TaskSchedulerRule,
} from "../shared/grabbit"

export const ARIA2_RPC_PORT = 16800
export const ARIA2_RPC_SECRET = "grabbit"
export const ARIA2_RPC_URL = `http://127.0.0.1:${ARIA2_RPC_PORT}/jsonrpc`

const SAVE_SESSION_INTERVAL_SECONDS = 15
const MIN_SPLIT_SIZE = "1M"
const SUMMARY_INTERVAL_SECONDS = 0

type BuildAria2StartupArgsInput = {
  preferences: GrabbitPreferences
  schedulerRule: TaskSchedulerRule
  sessionPath: string
}

export const buildAria2StartupArgs = ({
  preferences,
  schedulerRule,
  sessionPath,
}: BuildAria2StartupArgsInput) => {
  const globalOptions = {
    ...buildGlobalAria2Options(preferences),
    ...buildSchedulerGlobalOptions(schedulerRule, preferences),
  }

  return [
    "--enable-rpc=true",
    "--rpc-listen-all=false",
    `--rpc-listen-port=${ARIA2_RPC_PORT}`,
    `--rpc-secret=${ARIA2_RPC_SECRET}`,
    `--dir=${globalOptions.dir}`,
    `--input-file=${sessionPath}`,
    `--save-session=${sessionPath}`,
    `--save-session-interval=${SAVE_SESSION_INTERVAL_SECONDS}`,
    `--continue=${globalOptions.continue}`,
    `--max-concurrent-downloads=${globalOptions["max-concurrent-downloads"]}`,
    `--max-connection-per-server=${globalOptions["max-connection-per-server"]}`,
    `--split=${globalOptions.split}`,
    `--max-overall-download-limit=${globalOptions["max-overall-download-limit"]}`,
    `--max-overall-upload-limit=${globalOptions["max-overall-upload-limit"]}`,
    ...(globalOptions["all-proxy"]
      ? [`--all-proxy=${globalOptions["all-proxy"]}`]
      : []),
    ...(globalOptions["user-agent"]
      ? [`--user-agent=${globalOptions["user-agent"]}`]
      : []),
    `--bt-save-metadata=${globalOptions["bt-save-metadata"]}`,
    `--bt-force-encryption=${globalOptions["bt-force-encryption"]}`,
    `--follow-torrent=${globalOptions["follow-torrent"]}`,
    `--follow-metalink=${globalOptions["follow-metalink"]}`,
    `--seed-ratio=${globalOptions["seed-ratio"]}`,
    `--seed-time=${globalOptions["seed-time"]}`,
    ...(globalOptions["bt-tracker"]
      ? [`--bt-tracker=${globalOptions["bt-tracker"]}`]
      : []),
    `--listen-port=${globalOptions["listen-port"]}`,
    `--dht-listen-port=${globalOptions["dht-listen-port"]}`,
    `--min-split-size=${MIN_SPLIT_SIZE}`,
    `--summary-interval=${SUMMARY_INTERVAL_SECONDS}`,
  ]
}
