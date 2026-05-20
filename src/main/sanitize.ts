import type { Aria2Options } from "../shared/download-api"

export function sanitizeTaskOptions(options: Aria2Options | undefined) {
  if (!options) {
    return options
  }

  const nextOptions = { ...options }
  const out = nextOptions.out

  if (typeof out === "string") {
    const sanitizedOut = sanitizeOutputFileName(out)

    if (sanitizedOut) {
      nextOptions.out = sanitizedOut
    } else {
      delete nextOptions.out
    }
  }

  return nextOptions
}

function sanitizeOutputFileName(value: string) {
  const basename = value.split(/[\\/]/).at(-1)?.trim()

  if (
    !basename ||
    basename === "." ||
    basename === ".." ||
    basename.includes("\0")
  ) {
    return null
  }

  const sanitized = basename
    .split("")
    .map((character) =>
      isInvalidFileNameCharacter(character) ? "_" : character
    )
    .join("")
    .replace(/[. ]+$/g, "")
    .slice(0, 255)

  if (!sanitized || sanitized === "." || sanitized === "..") {
    return null
  }

  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(sanitized)) {
    return `_${sanitized}`
  }

  return sanitized
}

function isInvalidFileNameCharacter(character: string) {
  const code = character.charCodeAt(0)
  return code < 32 || code === 127 || /[<>:"/\\|?*]/.test(character)
}
