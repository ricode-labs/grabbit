export type GrabbitPreferences = {
  downloadDir: string
  maxConcurrentDownloads: number
  maxConnectionPerServer: number
  split: number
  maxOverallDownloadLimit: string
  maxOverallUploadLimit: string
  continueDownloads: boolean
  allProxy: string
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
  }
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
  return normalizeAria2Options({
    dir: preferences.downloadDir,
    maxConcurrentDownloads: preferences.maxConcurrentDownloads,
    maxConnectionPerServer: preferences.maxConnectionPerServer,
    split: preferences.split,
    maxOverallDownloadLimit: preferences.maxOverallDownloadLimit,
    maxOverallUploadLimit: preferences.maxOverallUploadLimit,
    continue: preferences.continueDownloads,
    allProxy: preferences.allProxy,
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
