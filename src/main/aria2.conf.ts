import ky from "ky"
import {
  btTrackerPath,
  dht6Path,
  dhtPath,
  logPath,
  netrcPath,
  serverStatPath,
  sessionPath,
} from "./paths"
import { outputFile, pathExists, readFile } from "fs-extra"
import { getPreferences } from "./preferences"

const preferences = getPreferences()

// update trackers
export async function updateTrackers() {
  const text = await ky
    .get(
      "https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all.txt"
    )
    .text()
  const trackers = text.split("\n").join(",")
  await outputFile(btTrackerPath, trackers, "utf8")
}

// read trackers
async function readTrackers() {
  try {
    const trackers = await readFile(btTrackerPath, "utf8")
    return trackers
  } catch {
    return ""
  }
}

async function basicOptions() {
  const options = [
    // The directory to store the downloaded file
    `--dir=${preferences.downloadDirectoryPath}`,
    // The file name of the log file
    `--log=${logPath}`,
    // Set the maximum number of parallel downloads for every queue item
    `--max-concurrent-downloads=5`,
    // Check file integrity by validating piece hashes or a hash of entire file
    "--check-integrity=true",
    // Continue downloading a partially downloaded file
    `--continue=true`,
  ]
  if (await pathExists(sessionPath)) {
    // Downloads the URIs listed in FILE
    options.push(`--input-file=${sessionPath}`)
  }
  return options
}

const httpFtpSftpOptions = [
  // The maximum number of connections to one server for each download
  "--max-connection-per-server=5",
  // aria2 does not split less than 2*SIZE byte range
  "--min-split-size=1M",
  // Specify the path to the netrc file
  `--netrc-path=${netrcPath}`,
  // Specify the file name to which performance profile of the servers is saved
  `--server-stat-of=${serverStatPath}`,
  // Specify the file name to load performance profile of the servers
  `--server-stat-if=${serverStatPath}`,
  // Download a file using N connections
  "--split=5",
  // Specify piece selection algorithm used in HTTP/FTP download
  "--stream-piece-selector=geom",
]

// const httpSpecificOptions = []

// const ftpSftpSpecificOptions = []

// const bitTorrentMetalinkOptions = []

async function bitTorrentSpecificOptions() {
  return [
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
    `--bt-tracker=${await readTrackers()}`,
    // Change the IPv4 DHT routing table file to PATH
    `--dht-file-path=${dhtPath}`,
    // Change the IPv6 DHT routing table file to PATH
    `--dht-file-path6=${dht6Path}`,
    // Enable IPv6 DHT functionality
    "--enable-dht6=true",
    // Set max overall upload speed in bytes/sec
    `--max-overall-upload-limit=${preferences.maxOverallUploadLimit}`,
    // Specify share ratio
    `--seed-ratio=0.0`,
    // pecify seeding time in (fractional) minutes
    `--seed-time=0`,
  ]
}
// const metalinkSpecificOptions = []

function rpcOptions(rpcPort: number, rpcSecret: string) {
  return [
    // Enable JSON-RPC/XML-RPC server
    "--enable-rpc=true",
    // Specify a port number for JSON-RPC/XML-RPC server to listen to
    `--rpc-listen-port=${rpcPort}`,
    // Set RPC authorization secret for this app session
    `--rpc-secret=${rpcSecret}`,
  ]
}

function advancedOptions() {
  return [
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
    `--max-overall-download-limit=${preferences.maxOverallDownloadLimit}`,
    // Disable loading aria2.conf file
    "--no-conf=true",
    // Save error/unfinished downloads to FILE on exit
    `--save-session=${sessionPath}`,
    // Save error/unfinished downloads to a file specified by --save-session option every SEC seconds
    "--save-session-interval=10",
    // Stop application when process PID is not running
    `--stop-with-process=${process.pid}`,
  ]
}

export async function aria2StartupArgs(rpcPort: number, rpcSecret: string) {
  return [
    ...await basicOptions(),
    ...httpFtpSftpOptions,
    ...await bitTorrentSpecificOptions(),
    ...rpcOptions(rpcPort, rpcSecret),
    ...advancedOptions(),
  ]
}
