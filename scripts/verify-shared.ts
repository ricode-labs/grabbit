import assert from "node:assert/strict"
import {
  buildAddTaskOptions,
  buildGlobalAria2Options,
  buildInitialAddTaskForm,
  buildSchedulerGlobalOptions,
  defaultGrabbitPreferences,
  defaultTaskSchedulerRule,
  isSchedulerRuleActive,
  normalizeAria2Options,
  normalizeDownloadDirectoryHistory,
  normalizeTaskSchedulerRule,
  parseCurlCommand,
  parseExternalTaskIntent,
  parseExternalTaskIntents,
  splitTaskLinks,
  thunderLinkToUri,
  buildTorrentSelectFileOption,
  getUserAgentTemplate,
  userAgentTemplates,
  calculateProgress,
  flattenAnnounceList,
  summarizeFiles,
  summarizePeers,
  toFiniteNumber,
  type AddTaskForm,
} from "../src/shared/grabbit"

const form: AddTaskForm = {
  uris: "https://example.com/file.zip",
  torrentPath: "",
  selectedTorrentFiles: "",
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

const thunderHttp = "thunder://QUFodHRwczovL2V4YW1wbGUuY29tL3RodW5kZXIuemlwWlo="
const thunderFtp = "thunder://QUFmdHA6Ly9leGFtcGxlLmNvbS9iLmlzb1pa"

assert.equal(thunderLinkToUri(thunderHttp), "https://example.com/thunder.zip")
assert.equal(thunderLinkToUri("thunder://not-base64"), null)
assert.equal(buildTorrentSelectFileOption([2, 1, 2], 3), "1,2")
assert.equal(buildTorrentSelectFileOption([1, 2, 3], 3), "")

assert.deepEqual(
  userAgentTemplates.map((template) => template.label),
  ["Aria2", "Transmission", "Chrome", "du"]
)
assert.equal(getUserAgentTemplate("Aria2"), "aria2/1.36.0")
assert.match(getUserAgentTemplate("Chrome"), /Chrome\/120/)
assert.match(getUserAgentTemplate("du"), /netdisk/)

assert.deepEqual(
  {
    openAtLogin: defaultGrabbitPreferences("/tmp/grabbit-downloads")
      .openAtLogin,
    notifyOnDownloadComplete: defaultGrabbitPreferences(
      "/tmp/grabbit-downloads"
    ).notifyOnDownloadComplete,
    showDockProgress: defaultGrabbitPreferences("/tmp/grabbit-downloads")
      .showDockProgress,
    theme: defaultGrabbitPreferences("/tmp/grabbit-downloads").theme,
    resumeAllOnLaunch: defaultGrabbitPreferences("/tmp/grabbit-downloads")
      .resumeAllOnLaunch,
    closeToTray: defaultGrabbitPreferences("/tmp/grabbit-downloads")
      .closeToTray,
  },
  {
    openAtLogin: false,
    notifyOnDownloadComplete: true,
    showDockProgress: true,
    theme: "system",
    resumeAllOnLaunch: false,
    closeToTray: false,
  }
)

assert.deepEqual(parseExternalTaskIntent("magnet:?xt=urn:btih:abc"), {
  kind: "uri",
  value: "magnet:?xt=urn:btih:abc",
})
assert.deepEqual(parseExternalTaskIntent(thunderHttp), {
  kind: "uri",
  value: "https://example.com/thunder.zip",
})
assert.deepEqual(parseExternalTaskIntent("/tmp/example.torrent"), {
  kind: "torrent",
  value: "/tmp/example.torrent",
})
assert.deepEqual(
  parseExternalTaskIntent(
    "motrix://new-task?uri=https%3A%2F%2Fexample.com%2Fa.zip"
  ),
  {
    kind: "uri",
    value: "https://example.com/a.zip",
    command: "new-task",
    args: { uri: "https://example.com/a.zip" },
  }
)
assert.deepEqual(
  parseExternalTaskIntents([
    "--flag",
    "mo://new-task",
    "https://example.com/file.zip",
  ]),
  [
    { kind: "command", value: "mo://new-task", command: "new-task", args: {} },
    { kind: "uri", value: "https://example.com/file.zip" },
  ]
)

assert.deepEqual(
  splitTaskLinks(
    `https://example.com/a.zip\n ${thunderHttp} ${thunderFtp} magnet:?xt=urn:btih:abc ftp://example.com/b.iso`
  ),
  [
    "https://example.com/a.zip",
    "https://example.com/thunder.zip",
    "ftp://example.com/b.iso",
    "magnet:?xt=urn:btih:abc",
    "ftp://example.com/b.iso",
  ]
)

assert.deepEqual(
  normalizeDownloadDirectoryHistory(
    "/downloads/new",
    [
      "/downloads/old",
      "",
      "/downloads/new",
      "/downloads/older",
      "/downloads/old",
    ],
    3
  ),
  ["/downloads/new", "/downloads/old", "/downloads/older"]
)

assert.deepEqual(
  parseCurlCommand(
    "curl 'https://example.com/file.zip' -H 'Referer: https://example.com' -H 'Cookie: a=b' -A 'Agent/1.0' -o out.zip"
  ),
  {
    uris: ["https://example.com/file.zip"],
    out: "out.zip",
    userAgent: "Agent/1.0",
    authorization: "",
    referer: "https://example.com",
    cookie: "a=b",
  }
)

assert.deepEqual(
  buildInitialAddTaskForm({
    ...defaultGrabbitPreferences("/downloads"),
    split: 24,
    userAgent: "Mozilla/5.0 Grabbit",
    allProxy: "http://proxy.local:8080",
    newTaskShowDownloading: false,
  }),
  {
    uris: "",
    torrentPath: "",
    selectedTorrentFiles: "",
    out: "",
    split: 24,
    dir: "/downloads",
    userAgent: "Mozilla/5.0 Grabbit",
    authorization: "",
    referer: "",
    cookie: "",
    allProxy: "http://proxy.local:8080",
    showDownloading: false,
  }
)

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
    userAgent: "Transmission/3.00",
    btSaveMetadata: true,
    btForceEncryption: true,
    followTorrent: true,
    followMetalink: true,
    seedRatio: 1.5,
    seedTime: 120,
    btTracker:
      "udp://tracker.example:80/announce\nhttps://tracker.example/announce",
    enableUpnp: false,
    listenPort: "51413",
    dhtListenPort: "6881",
    newTaskShowDownloading: false,
    noConfirmBeforeDeleteTask: true,
    downloadDirectoryHistory: ["/downloads", "/archive"],
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
    "user-agent": "Transmission/3.00",
    "bt-save-metadata": "true",
    "bt-force-encryption": "true",
    "follow-torrent": "true",
    "follow-metalink": "true",
    "seed-ratio": "1.5",
    "seed-time": "120",
    "bt-tracker":
      "udp://tracker.example:80/announce,https://tracker.example/announce",
    "listen-port": "51413",
    "dht-listen-port": "6881",
  }
)

const invalidScheduler = normalizeTaskSchedulerRule({
  enabled: true,
  speedMode: "manual",
  downloadLimit: "256K",
  uploadLimit: "128K",
  startTime: "99:00",
  endTime: "18:00",
  repeatDays: [-1, 1, 1, 8, 5],
})

assert.deepEqual(invalidScheduler, {
  ...defaultTaskSchedulerRule(),
  enabled: true,
  downloadLimit: "256K",
  uploadLimit: "128K",
  endTime: "18:00",
  repeatDays: [1, 5],
})

const weekdayRule = normalizeTaskSchedulerRule({
  enabled: true,
  startTime: "09:00",
  endTime: "18:00",
  repeatDays: [1, 2, 3, 4, 5],
})

assert.equal(
  isSchedulerRuleActive(weekdayRule, new Date("2026-06-01T10:00:00")),
  true
)
assert.equal(
  isSchedulerRuleActive(weekdayRule, new Date("2026-06-01T19:00:00")),
  false
)
assert.equal(
  isSchedulerRuleActive(weekdayRule, new Date("2026-06-07T10:00:00")),
  false
)

const nightRule = normalizeTaskSchedulerRule({
  enabled: true,
  startTime: "22:00",
  endTime: "06:00",
  repeatDays: [1],
})
assert.equal(
  isSchedulerRuleActive(nightRule, new Date("2026-06-01T23:00:00")),
  true
)
assert.equal(
  isSchedulerRuleActive(nightRule, new Date("2026-06-01T12:00:00")),
  false
)

assert.deepEqual(
  buildSchedulerGlobalOptions(
    normalizeTaskSchedulerRule({
      enabled: true,
      downloadLimit: "300K",
      uploadLimit: "100K",
      startTime: "09:00",
      endTime: "18:00",
      repeatDays: [1],
    }),
    defaultGrabbitPreferences("/downloads"),
    new Date("2026-06-01T12:00:00")
  ),
  {
    "max-overall-download-limit": "300K",
    "max-overall-upload-limit": "100K",
  }
)

assert.deepEqual(
  buildSchedulerGlobalOptions(
    normalizeTaskSchedulerRule({
      enabled: true,
      speedMode: "unlimited",
      startTime: "09:00",
      endTime: "18:00",
      repeatDays: [1],
    }),
    defaultGrabbitPreferences("/downloads"),
    new Date("2026-06-01T12:00:00")
  ),
  {
    "max-overall-download-limit": "0",
    "max-overall-upload-limit": "0",
  }
)

assert.equal(toFiniteNumber("1024"), 1024)
assert.equal(toFiniteNumber("bad"), 0)
assert.equal(calculateProgress("512", "1024"), 50)
assert.equal(calculateProgress("512", "0"), 0)

assert.deepEqual(
  summarizeFiles([
    { path: "a.mkv", length: "100", completedLength: "100", selected: "true" },
    { path: "b.srt", length: "50", completedLength: "25", selected: "false" },
  ]),
  {
    count: 2,
    selectedCount: 1,
    totalLength: 150,
    completedLength: 125,
    progress: 83,
  }
)

assert.deepEqual(
  flattenAnnounceList([
    ["udp://tracker.example/announce", ""],
    ["udp://tracker.example/announce", "https://tracker.example/announce"],
  ]),
  ["udp://tracker.example/announce", "https://tracker.example/announce"]
)

assert.deepEqual(
  summarizePeers([
    {
      ip: "127.0.0.1",
      downloadSpeed: "1024",
      uploadSpeed: "128",
      seeder: "true",
    },
    {
      ip: "127.0.0.2",
      downloadSpeed: "2048",
      uploadSpeed: "256",
      seeder: "false",
    },
  ]),
  {
    count: 2,
    seeders: 1,
    downloadSpeed: 3072,
    uploadSpeed: 384,
  }
)

console.log("grabbit shared helpers OK")
