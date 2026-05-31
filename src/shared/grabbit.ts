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

export type AddTaskForm = {
  uris: string
  torrentPath: string
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

export function defaultGrabbitPreferences(downloadDir: string): GrabbitPreferences {
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
  }
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
    startTime: rule?.startTime && timePattern.test(rule.startTime) ? rule.startTime : defaults.startTime,
    endTime: rule?.endTime && timePattern.test(rule.endTime) ? rule.endTime : defaults.endTime,
    repeatDays: repeatDays.length > 0 ? repeatDays : defaults.repeatDays,
  }
}

const minutesOfDay = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function isSchedulerRuleActive(rule: TaskSchedulerRule, now = new Date()) {
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

    const kebabKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    result[kebabKey] = String(value)
  }

  return result
}

export function buildInitialAddTaskForm(preferences: GrabbitPreferences): AddTaskForm {
  return {
    uris: "",
    torrentPath: "",
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
    enableUpnp: preferences.enableUpnp,
    listenPort: preferences.listenPort,
    dhtListenPort: preferences.dhtListenPort,
  })
}

export function splitTaskLinks(input: string) {
  return input
    .split(/[\s\n]+/)
    .map((value) => value.trim())
    .filter((value) => /^(https?|ftp):\/\//i.test(value) || /^magnet:\?/i.test(value))
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
