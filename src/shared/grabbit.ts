export type GrabbitThemeMode = "light" | "dark" | "system"

export const userAgentTemplates = [
  {
    label: "Aria2",
    value: "aria2/1.36.0",
  },
  {
    label: "Transmission",
    value: "Transmission/4.0.5",
  },
  {
    label: "Chrome",
    value:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  {
    label: "du",
    value: "netdisk;11.4.5;PC;PC-Windows;10.0.19045;WindowsBaiduYunGuanJia",
  },
] as const

export type UserAgentTemplateLabel =
  (typeof userAgentTemplates)[number]["label"]

export function getUserAgentTemplate(label: UserAgentTemplateLabel) {
  return (
    userAgentTemplates.find((template) => template.label === label)?.value ?? ""
  )
}

export type GrabbitPreferences = {
  downloadDir: string
  maxConcurrentDownloads: number
  maxConnectionPerServer: number
  split: number
  maxOverallDownloadLimit: string
  maxOverallUploadLimit: string
  continueDownloads: boolean
  allProxy: string
  userAgent: string
  btSaveMetadata: boolean
  btForceEncryption: boolean
  followTorrent: boolean
  followMetalink: boolean
  seedRatio: number
  seedTime: number
  btTracker: string
  enableUpnp: boolean
  listenPort: string
  dhtListenPort: string
  newTaskShowDownloading: boolean
  noConfirmBeforeDeleteTask: boolean
  downloadDirectoryHistory: string[]
  openAtLogin: boolean
  notifyOnDownloadComplete: boolean
  showDockProgress: boolean
  theme: GrabbitThemeMode
  resumeAllOnLaunch: boolean
  closeToTray: boolean
}

export type EnginePathInfo = {
  key:
    | "aria2"
    | "session"
    | "preferences"
    | "scheduler"
    | "userData"
    | "downloads"
  label: string
  path: string
  kind: "file" | "directory"
}

export type SchedulerSpeedMode = "manual" | "unlimited"

export type TaskSchedulerRule = {
  enabled: boolean
  speedMode: SchedulerSpeedMode
  downloadLimit: string
  uploadLimit: string
  startTime: string
  endTime: string
  repeatDays: number[]
}

export type TorrentFileEntry = {
  index: number
  path: string
  name: string
  extension: string
  length: number
}

export type ParsedTorrentInfo = {
  name: string
  files: TorrentFileEntry[]
  totalLength: number
}

export type Aria2LikeFile = {
  path?: string
  length?: string | number
  completedLength?: string | number
  selected?: string
}

export type Aria2LikePeer = {
  peerId?: string
  ip?: string
  port?: string
  bitfield?: string
  amChoking?: string
  peerChoking?: string
  downloadSpeed?: string
  uploadSpeed?: string
  seeder?: string
}

export type Aria2BittorrentLike = {
  announceList?: string[][]
  comment?: string
  creationDate?: string | number
  mode?: string
  info?: { name?: string }
}

export function toFiniteNumber(value: string | number | undefined) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

export function calculateProgress(
  completed: string | number | undefined,
  total: string | number | undefined
) {
  const totalNumber = toFiniteNumber(total)
  if (totalNumber <= 0) {
    return 0
  }

  return Math.min(
    100,
    Math.round((toFiniteNumber(completed) / totalNumber) * 100)
  )
}

export function summarizeFiles(files: Aria2LikeFile[] = []) {
  const totalLength = files.reduce(
    (sum, file) => sum + toFiniteNumber(file.length),
    0
  )
  const completedLength = files.reduce(
    (sum, file) => sum + toFiniteNumber(file.completedLength),
    0
  )
  const selectedCount = files.filter((file) => file.selected === "true").length

  return {
    count: files.length,
    selectedCount,
    totalLength,
    completedLength,
    progress: calculateProgress(completedLength, totalLength),
  }
}

export function flattenAnnounceList(announceList: string[][] | undefined) {
  return Array.from(
    new Set(
      (announceList ?? [])
        .flat()
        .map((tracker) => tracker.trim())
        .filter(Boolean)
    )
  )
}

export function summarizePeers(peers: Aria2LikePeer[] = []) {
  return {
    count: peers.length,
    seeders: peers.filter((peer) => peer.seeder === "true").length,
    downloadSpeed: peers.reduce(
      (sum, peer) => sum + toFiniteNumber(peer.downloadSpeed),
      0
    ),
    uploadSpeed: peers.reduce(
      (sum, peer) => sum + toFiniteNumber(peer.uploadSpeed),
      0
    ),
  }
}

export type AddTaskForm = {
  uris: string
  torrentPath: string
  selectedTorrentFiles: string
  out: string
  split: number
  dir: string
  userAgent: string
  authorization: string
  referer: string
  cookie: string
  allProxy: string
  showDownloading: boolean
}

export type ParsedCurlCommand = {
  uris: string[]
  out: string
  userAgent: string
  authorization: string
  referer: string
  cookie: string
}

export type GrabbitProtocolPayload = {
  url: string
  filename?: string
  userAgent?: string
  authorization?: string
  referer?: string
  cookie?: string
}

export function defaultGrabbitPreferences(
  downloadDir: string
): GrabbitPreferences {
  return {
    downloadDir,
    maxConcurrentDownloads: 5,
    maxConnectionPerServer: 16,
    split: 16,
    maxOverallDownloadLimit: "0",
    maxOverallUploadLimit: "0",
    continueDownloads: true,
    allProxy: "",
    userAgent: "",
    btSaveMetadata: true,
    btForceEncryption: false,
    followTorrent: true,
    followMetalink: true,
    seedRatio: 1,
    seedTime: 0,
    btTracker: "",
    enableUpnp: true,
    listenPort: "6881",
    dhtListenPort: "6881",
    newTaskShowDownloading: true,
    noConfirmBeforeDeleteTask: false,
    downloadDirectoryHistory: downloadDir ? [downloadDir] : [],
    openAtLogin: false,
    notifyOnDownloadComplete: true,
    showDockProgress: true,
    theme: "system",
    resumeAllOnLaunch: false,
    closeToTray: false,
  }
}

export function normalizeDownloadDirectoryHistory(
  nextDirectory: string,
  history: Array<string | null | undefined> = [],
  limit = 8
) {
  return [nextDirectory, ...history]
    .map((directory) => directory?.trim() ?? "")
    .filter(Boolean)
    .filter(
      (directory, index, directories) =>
        directories.indexOf(directory) === index
    )
    .slice(0, limit)
}

const fullWeekDays = [1, 2, 3, 4, 5, 6, 0]

export function defaultTaskSchedulerRule(): TaskSchedulerRule {
  return {
    enabled: false,
    speedMode: "manual",
    downloadLimit: "0",
    uploadLimit: "0",
    startTime: "00:00",
    endTime: "23:59",
    repeatDays: fullWeekDays,
  }
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

export function normalizeTaskSchedulerRule(
  rule: Partial<TaskSchedulerRule> | null | undefined
): TaskSchedulerRule {
  const defaults = defaultTaskSchedulerRule()
  const repeatDays = Array.from(
    new Set(
      (rule?.repeatDays ?? defaults.repeatDays)
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    )
  )

  return {
    enabled: rule?.enabled ?? defaults.enabled,
    speedMode: rule?.speedMode === "unlimited" ? "unlimited" : "manual",
    downloadLimit: rule?.downloadLimit ?? defaults.downloadLimit,
    uploadLimit: rule?.uploadLimit ?? defaults.uploadLimit,
    startTime:
      rule?.startTime && timePattern.test(rule.startTime)
        ? rule.startTime
        : defaults.startTime,
    endTime:
      rule?.endTime && timePattern.test(rule.endTime)
        ? rule.endTime
        : defaults.endTime,
    repeatDays: repeatDays.length > 0 ? repeatDays : defaults.repeatDays,
  }
}

const minutesOfDay = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function isSchedulerRuleActive(
  rule: TaskSchedulerRule,
  now = new Date()
) {
  if (!rule.enabled || !rule.repeatDays.includes(now.getDay())) {
    return false
  }

  const start = minutesOfDay(rule.startTime)
  const end = minutesOfDay(rule.endTime)
  const current = now.getHours() * 60 + now.getMinutes()

  if (start === end) {
    return true
  }

  if (start < end) {
    return current >= start && current <= end
  }

  return current >= start || current <= end
}

export function buildSchedulerGlobalOptions(
  rule: TaskSchedulerRule,
  preferences: GrabbitPreferences,
  now = new Date()
) {
  if (!isSchedulerRuleActive(rule, now)) {
    return buildGlobalAria2Options(preferences)
  }

  if (rule.speedMode === "unlimited") {
    return normalizeAria2Options({
      maxOverallDownloadLimit: "0",
      maxOverallUploadLimit: "0",
    })
  }

  return normalizeAria2Options({
    maxOverallDownloadLimit: rule.downloadLimit,
    maxOverallUploadLimit: rule.uploadLimit,
  })
}

export function normalizeAria2Options(
  options: Record<string, string | number | boolean | undefined> = {}
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === "") {
      continue
    }

    const kebabKey = key.replace(
      /[A-Z]/g,
      (letter) => `-${letter.toLowerCase()}`
    )
    result[kebabKey] = String(value)
  }

  return result
}

export function buildInitialAddTaskForm(
  preferences: GrabbitPreferences
): AddTaskForm {
  return {
    uris: "",
    torrentPath: "",
    selectedTorrentFiles: "",
    out: "",
    split: preferences.split,
    dir: preferences.downloadDir,
    userAgent: preferences.userAgent,
    authorization: "",
    referer: "",
    cookie: "",
    allProxy: preferences.allProxy,
    showDownloading: preferences.newTaskShowDownloading,
  }
}

export function buildAddTaskOptions(form: AddTaskForm) {
  return {
    out: form.out,
    split: form.split,
    dir: form.dir,
    ...(form.selectedTorrentFiles
      ? { selectFile: form.selectedTorrentFiles }
      : {}),
    userAgent: form.userAgent,
    header: [
      form.authorization ? `Authorization: ${form.authorization}` : "",
      form.referer ? `Referer: ${form.referer}` : "",
      form.cookie ? `Cookie: ${form.cookie}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    allProxy: form.allProxy,
  }
}

function stringFromUnknown(value: unknown) {
  return typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim() : ""
}

export function buildProtocolAddUriOptions(payload: GrabbitProtocolPayload) {
  return normalizeAria2Options({
    out: stringFromUnknown(payload.filename),
    userAgent: stringFromUnknown(payload.userAgent),
    header: [
      payload.authorization
        ? `Authorization: ${stringFromUnknown(payload.authorization)}`
        : "",
      payload.referer ? `Referer: ${stringFromUnknown(payload.referer)}` : "",
      payload.cookie ? `Cookie: ${stringFromUnknown(payload.cookie)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  })
}

function decodeBase64UrlJson(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown
}

export function parseGrabbitProtocolPayload(value: string) {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(value)
  } catch {
    return null
  }

  if (parsedUrl.protocol !== "grabbit:" || parsedUrl.hostname !== "add") {
    return null
  }

  const encodedPayload = parsedUrl.searchParams.get("payload")
  if (!encodedPayload) {
    return null
  }

  try {
    const payload = decodeBase64UrlJson(encodedPayload)
    if (!payload || typeof payload !== "object") {
      return null
    }

    const record = payload as Record<string, unknown>
    const url = normalizeTaskLink(stringFromUnknown(record.url))
    if (!url) {
      return null
    }

    return {
      url,
      filename: stringFromUnknown(record.filename),
      userAgent: stringFromUnknown(record.userAgent),
      authorization: stringFromUnknown(record.authorization),
      referer: stringFromUnknown(record.referer),
      cookie: stringFromUnknown(record.cookie),
    } satisfies GrabbitProtocolPayload
  } catch {
    return null
  }
}

export function buildGlobalAria2Options(preferences: GrabbitPreferences) {
  const trackerList = preferences.btTracker
    .split(/[\n,]+/)
    .map((tracker) => tracker.trim())
    .filter(Boolean)
    .join(",")

  return normalizeAria2Options({
    dir: preferences.downloadDir,
    maxConcurrentDownloads: preferences.maxConcurrentDownloads,
    maxConnectionPerServer: preferences.maxConnectionPerServer,
    split: preferences.split,
    maxOverallDownloadLimit: preferences.maxOverallDownloadLimit,
    maxOverallUploadLimit: preferences.maxOverallUploadLimit,
    continue: preferences.continueDownloads,
    allProxy: preferences.allProxy,
    userAgent: preferences.userAgent,
    btSaveMetadata: preferences.btSaveMetadata,
    btForceEncryption: preferences.btForceEncryption,
    followTorrent: preferences.followTorrent,
    followMetalink: preferences.followMetalink,
    seedRatio: preferences.seedRatio,
    seedTime: preferences.seedTime,
    btTracker: trackerList,
    listenPort: preferences.listenPort,
    dhtListenPort: preferences.dhtListenPort,
  })
}

export function buildTorrentSelectFileOption(
  selectedIndexes: number[],
  totalFiles: number
) {
  if (totalFiles <= 0 || selectedIndexes.length === 0) {
    return ""
  }

  const uniqueIndexes = Array.from(
    new Set(
      selectedIndexes
        .map((index) => Number(index))
        .filter(
          (index) =>
            Number.isInteger(index) && index >= 1 && index <= totalFiles
        )
    )
  ).sort((left, right) => left - right)

  if (uniqueIndexes.length === 0 || uniqueIndexes.length === totalFiles) {
    return ""
  }

  return uniqueIndexes.join(",")
}

export function isMediaTorrentFile(
  file: Pick<TorrentFileEntry, "extension">,
  kind: "video" | "audio" | "image" | "document"
) {
  const extension = file.extension.toLowerCase().replace(/^\./, "")
  const groups = {
    video: [
      "avi",
      "flv",
      "m2ts",
      "m4v",
      "mkv",
      "mov",
      "mp4",
      "mpeg",
      "mpg",
      "rmvb",
      "ts",
      "webm",
      "wmv",
    ],
    audio: ["aac", "ape", "flac", "m4a", "mp3", "ogg", "wav", "wma"],
    image: ["bmp", "gif", "jpeg", "jpg", "png", "svg", "webp"],
    document: [
      "azw3",
      "chm",
      "doc",
      "docx",
      "epub",
      "mobi",
      "pdf",
      "ppt",
      "pptx",
      "txt",
      "xls",
      "xlsx",
    ],
  } as const

  return groups[kind].includes(extension as never)
}

export type ExternalTaskIntent = {
  kind: "uri" | "torrent" | "command"
  value: string
  command?: string
  args?: Record<string, string>
}

export const supportedExternalProtocols = [
  "magnet",
  "thunder",
  "mo",
  "motrix",
] as const

export function isTorrentPath(value: string) {
  return /\.torrent(?:$|[?#])/i.test(value.trim())
}

export function parseExternalTaskIntent(
  value: string
): ExternalTaskIntent | null {
  const input = value.trim()
  if (!input) {
    return null
  }

  if (isTorrentPath(input) && !/^[a-z][a-z0-9+.-]*:/i.test(input)) {
    return { kind: "torrent", value: input }
  }

  const normalizedUri = normalizeTaskLink(input)
  if (normalizedUri) {
    return { kind: "uri", value: normalizedUri }
  }

  if (/^(mo|motrix):/i.test(input)) {
    try {
      const parsed = new URL(input)
      const args = Object.fromEntries(parsed.searchParams.entries())
      const uri = args.uri || args.url || args.link || ""
      const torrentPath = args.path || args.file || ""

      if (uri) {
        const normalized = normalizeTaskLink(uri)
        return normalized
          ? { kind: "uri", value: normalized, command: parsed.hostname, args }
          : null
      }

      if (torrentPath && isTorrentPath(torrentPath)) {
        return {
          kind: "torrent",
          value: torrentPath,
          command: parsed.hostname,
          args,
        }
      }

      return { kind: "command", value: input, command: parsed.hostname, args }
    } catch {
      return null
    }
  }

  return null
}

export function parseExternalTaskIntents(values: string[]) {
  return values
    .map(parseExternalTaskIntent)
    .filter((intent): intent is ExternalTaskIntent => Boolean(intent))
}

export function thunderLinkToUri(link: string): string | null {
  const payload = link.replace(/^thunder:\/\//i, "").trim()

  if (!payload) {
    return null
  }

  try {
    const decoded = Buffer.from(payload, "base64").toString("utf8")
    const match = decoded.match(/^AA([\s\S]+)ZZ$/)
    const uri = (match?.[1] ?? decoded).trim()
    return /^(https?|ftp):\/\//i.test(uri) || /^magnet:\?/i.test(uri)
      ? uri
      : null
  } catch {
    return null
  }
}

export function normalizeTaskLink(value: string): string | null {
  const link = value.trim()

  if (/^thunder:\/\//i.test(link)) {
    return thunderLinkToUri(link)
  }

  return /^(https?|ftp):\/\//i.test(link) || /^magnet:\?/i.test(link)
    ? link
    : null
}

export function splitTaskLinks(input: string) {
  return input
    .split(/[\s\n]+/)
    .map(normalizeTaskLink)
    .filter((value): value is string => Boolean(value))
}

function tokenizeCommand(command: string) {
  const tokens: string[] = []
  let current = ""
  let quote: '"' | "'" | null = null
  let escaped = false

  for (const character of command) {
    if (escaped) {
      current += character
      escaped = false
      continue
    }

    if (character === "\\" && quote !== "'") {
      escaped = true
      continue
    }

    if ((character === '"' || character === "'") && !quote) {
      quote = character
      continue
    }

    if (character === quote) {
      quote = null
      continue
    }

    if (/\s/.test(character) && !quote) {
      if (current) {
        tokens.push(current)
        current = ""
      }
      continue
    }

    current += character
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

export function parseCurlCommand(command: string): ParsedCurlCommand | null {
  const tokens = tokenizeCommand(command.trim())
  if (tokens.length === 0 || tokens[0] !== "curl") {
    return null
  }

  const result: ParsedCurlCommand = {
    uris: [],
    out: "",
    userAgent: "",
    authorization: "",
    referer: "",
    cookie: "",
  }

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index]
    const next = tokens[index + 1]

    if ((token === "-H" || token === "--header") && next) {
      const separator = next.indexOf(":")
      if (separator > 0) {
        const name = next.slice(0, separator).trim().toLowerCase()
        const value = next.slice(separator + 1).trim()
        if (name === "authorization") result.authorization = value
        if (name === "referer") result.referer = value
        if (name === "cookie") result.cookie = value
        if (name === "user-agent") result.userAgent = value
      }
      index += 1
      continue
    }

    if ((token === "-A" || token === "--user-agent") && next) {
      result.userAgent = next
      index += 1
      continue
    }

    if ((token === "-e" || token === "--referer") && next) {
      result.referer = next
      index += 1
      continue
    }

    if ((token === "-b" || token === "--cookie") && next) {
      result.cookie = next
      index += 1
      continue
    }

    if ((token === "-o" || token === "--output") && next) {
      result.out = next
      index += 1
      continue
    }

    if (/^(https?|ftp):\/\//i.test(token)) {
      result.uris.push(token)
    }
  }

  return result.uris.length > 0 ? result : null
}
