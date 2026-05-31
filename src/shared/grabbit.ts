export type GrabbitPreferences = {
  downloadDir: string
}

export type AddTaskForm = {
  uris: string
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
