export const supportedLocales = [
  "en",
  "zh-CN",
  "es",
  "fr",
  "de",
  "ja",
  "ko",
  "pt",
  "ru",
] as const

export type Locale = (typeof supportedLocales)[number]

export type Messages = {
  navigation: {
    tasks: string
    queue: string
    files: string
    history: string
    settings: string
  }
  topbar: {
    searchAria: string
    searchPlaceholder: string
    newTask: string
  }
  tabs: {
    overview: string
    queue: string
    history: string
    settings: string
  }
  status: {
    downloading: string
    queued: string
    paused: string
    seeding: string
    completed: string
  }
  hero: {
    badge: string
    title: string
    description: string
    metrics: {
      active: string
      done: string
      saved: string
    }
  }
  stats: {
    download: string
    upload: string
    disk: string
    rpc: string
  }
  taskPanel: {
    title: string
    description: string
    pauseAll: string
    columns: {
      name: string
      status: string
      speed: string
      eta: string
      action: string
    }
    resume: string
    moreActions: string
  }
  addDialog: {
    button: string
    title: string
    description: string
    source: string
    sourcePlaceholder: string
    saveTo: string
    connections: string
    cancel: string
    queueTask: string
  }
  taskDetails: {
    title: string
    actionLabel: string
    pause: string
    retry: string
    remove: string
  }
  quickControls: {
    title: string
    description: string
    queueLimit: string
    active: string
    downloadCap: string
    pauseAll: string
    resumeAll: string
  }
  history: {
    title: string
    description: string
    columns: {
      name: string
      size: string
      when: string
      status: string
    }
    completed: string
  }
  settings: {
    title: string
    description: string
    theme: string
    themePlaceholder: string
    dark: string
    light: string
    system: string
    defaultFolder: string
    rpcSecret: string
    language: string
  }
  liveLog: {
    title: string
    description: string
    scopes: {
      aria2c: string
      queue: string
      disk: string
      net: string
    }
  }
  queueSummary: {
    title: string
    description: string
    waiting: string
    tasks: string
    retryWait: string
    diskCache: string
  }
  footer: {
    serviceStatus: string
  }
  languageOptions: Record<Locale, string>
}
