import assert from "node:assert/strict"
import {
  buildAddTaskOptions,
  buildGlobalAria2Options,
  defaultGrabbitPreferences,
  normalizeAria2Options,
  parseCurlCommand,
  splitTaskLinks,
  type AddTaskForm,
} from "../src/shared/grabbit"

const form: AddTaskForm = {
  uris: "https://example.com/file.zip",
  torrentPath: "",
  out: "file.zip",
  split: 8,
  dir: "/tmp/grabbit-downloads",
  userAgent: "GrabbitTest/1.0",
  authorization: "Basic abc123",
  referer: "https://example.com",
  cookie: "a=b",
  allProxy: "http://127.0.0.1:8080",
  showDownloading: true,
}

assert.deepEqual(buildAddTaskOptions(form), {
  out: "file.zip",
  split: 8,
  dir: "/tmp/grabbit-downloads",
  userAgent: "GrabbitTest/1.0",
  header: [
    "Authorization: Basic abc123",
    "Referer: https://example.com",
    "Cookie: a=b",
  ].join("\n"),
  allProxy: "http://127.0.0.1:8080",
})

assert.deepEqual(
  normalizeAria2Options({
    out: "file.zip",
    split: 8,
    dir: "/tmp/grabbit-downloads",
    userAgent: "GrabbitTest/1.0",
    header: "Referer: https://example.com",
    allProxy: "",
    dryRun: false,
    unused: undefined,
  }),
  {
    out: "file.zip",
    split: "8",
    dir: "/tmp/grabbit-downloads",
    "user-agent": "GrabbitTest/1.0",
    header: "Referer: https://example.com",
    "dry-run": "false",
  }
)

assert.deepEqual(
  splitTaskLinks("https://example.com/a.zip\n magnet:?xt=urn:btih:abc ftp://example.com/b.iso"),
  ["https://example.com/a.zip", "magnet:?xt=urn:btih:abc", "ftp://example.com/b.iso"]
)

assert.deepEqual(parseCurlCommand("curl 'https://example.com/file.zip' -H 'Referer: https://example.com' -H 'Cookie: a=b' -A 'Agent/1.0' -o out.zip"), {
  uris: ["https://example.com/file.zip"],
  out: "out.zip",
  userAgent: "Agent/1.0",
  authorization: "",
  referer: "https://example.com",
  cookie: "a=b",
})

assert.deepEqual(
  buildGlobalAria2Options({
    ...defaultGrabbitPreferences("/downloads"),
    maxConcurrentDownloads: 5,
    maxConnectionPerServer: 12,
    split: 12,
    maxOverallDownloadLimit: "2M",
    maxOverallUploadLimit: "512K",
    continueDownloads: false,
    allProxy: "http://proxy.local:8080",
  }),
  {
    dir: "/downloads",
    "max-concurrent-downloads": "5",
    "max-connection-per-server": "12",
    split: "12",
    "max-overall-download-limit": "2M",
    "max-overall-upload-limit": "512K",
    continue: "false",
    "all-proxy": "http://proxy.local:8080",
  }
)

console.log("grabbit shared helpers OK")
