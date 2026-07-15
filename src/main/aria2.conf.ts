import path from "node:path"
import {
  buildGlobalAria2Options,
  buildSchedulerGlobalOptions,
  type GrabbitPreferences,
  type TaskSchedulerRule,
} from "../shared/grabbit"
import { app } from "electron/main"

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

const basicOptions = [
  // The directory to store the downloaded file
  `--dir=${path.join(app.getPath("downloads"), "Grabbit")}`,
  // Downloads the URIs listed in FILE
  `--input-file=${path.join(app.getPath("userData"), "aria2.session")}`,
  // The file name of the log file
  `--log=${path.join(app.getPath("userData"), "aria2.log")}`,
  // Set the maximum number of parallel downloads for every queue item
  `--max-concurrent-downloads=5`,
  // Check file integrity by validating piece hashes or a hash of entire file
  "--check-integrity=true",
  // Continue downloading a partially downloaded file
  `--continue=true`
]

const httpFtpSftpOptions = [
  // The maximum number of connections to one server for each download
  "--max-connection-per-server=16",
  // aria2 does not split less than 2*SIZE byte range
  "--min-split-size=1M",
  // Specify the file name to which performance profile of the servers is saved
  `--server-stat-of=${path.join(app.getPath("userData"), "aria2.server-stat")}`,
  // Specify the file name to load performance profile of the servers
  `--server-stat-if=${path.join(app.getPath("userData"), "aria2.server-stat")}`,
  // Download a file using N connections
  "--split=16",
  // Specify piece selection algorithm used in HTTP/FTP download
  "--stream-piece-selector=geom",
]

const httpSpecificOptions = [
  
]

const ftpSftpSpecificOptions = [
  
]

const bitTorrentMetalinkOptions = []

const bitTorrentSpecificOptions = [
  // Exclude seed only downloads when counting concurrent active downloads
  "--bt-detach-seed-only=true",
  // Enable Local Peer Discovery
  "--bt-enable-lpd=true",
  // Before getting torrent metadata from DHT when downloading with magnet link, first try to read file saved by --bt-save-metadata option
  "--bt-load-saved-metadata=true",
  // Specify maximum number of files to open in multi-file BitTorrent/Metalink download globally
  "--bt-max-open-files=200",
  // Specify the maximum number of peers per torrent
  "--bt-max-peers=100",
  // Try to download first and last pieces of each file first
  "--bt-prioritize-piece=head=50M,tail=10M",
  // If the whole download speed of every torrent is lower than SPEED, aria2 temporarily increases the number of peers to try for more download speed
  "--bt-request-peer-speed-limit=1M",
  // Save metadata as ".torrent" file
  "--bt-save-metadata=true",
  // Comma separated list of additional BitTorrent tracker's announce URI
  `--bt-tracker=https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all.txt`,
  // Change the IPv4 DHT routing table file to PATH
  `--dht-file-path=${path.join(app.getPath("userData"), "aria2.dht.dat")}`,
  // Change the IPv6 DHT routing table file to PATH
  `--dht-file-path6=${path.join(app.getPath("userData"), "aria2.dht6.dat")}`,
  // Enable IPv6 DHT functionality
  "--enable-dht6=true",
  // Set max overall upload speed in bytes/sec
  `--max-overall-upload-limit=0`,
  // Specify share ratio
  `--seed-ratio=0.0`,
  // pecify seeding time in (fractional) minutes
  `--seed-time=-1`,
]

const metalinkSpecificOptions = []

const rpcOptions = [
  // Enable JSON-RPC/XML-RPC server
  "--enable-rpc=true",
  // Specify a port number for JSON-RPC/XML-RPC server to listen to
  "--rpc-listen-port=6800"
]

const advancedOptions = [
  // Save a control file(*.aria2) every SEC seconds
  "--auto-save-interval=10",
  // Set log level to output to console
  "--console-log-level=warn",
  // Handle quoted string in Content-Disposition header as UTF-8 instead of ISO-8859-1
  "--content-disposition-default-utf8=true",
  // Enable disk cache
  "--disk-cache=128M",
  // Specify file allocation method
  "--file-allocation=none",
  // Set log level to output
  "--log-level=warn",
  // Show console readout
  "--show-console-readout=false",
  // Set interval in seconds to output download progress summary
  "--summary-interval=0",
  // Set max overall download speed in bytes/sec
  `--max-overall-download-limit=0`,
  // Disable loading aria2.conf file
  "--no-conf=true",
  // Save error/unfinished downloads to FILE on exit
  `--save-session=${path.join(app.getPath("userData"), "aria2.session")}`,
  // Save error/unfinished downloads to a file specified by --save-session option every SEC seconds
  "--save-session-interval=10"
]