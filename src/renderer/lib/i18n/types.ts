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
    filters: string
    notifications: string
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
    downloadDetail: string
    upload: string
    uploadDetail: string
    disk: string
    diskDetail: string
    rpc: string
    rpcDetail: string
  }
  taskPanel: {
    title: string
    description: string
    pauseAll: string
    retryFailed: string
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
    comment: string
    commentPlaceholder: string
    connections: string
    priority: string
    priorityPlaceholder: string
    low: string
    normal: string
    high: string
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
    messages: {
      rpcReady: string
      tasksWaiting: string
      sessionSaved: string
      peerCount: string
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
    traffic: string
  }
  languageOptions: Record<Locale, string>
}

type Primitive = string | number | boolean | null | undefined

type Paths<T> = {
  [K in keyof T & string]: T[K] extends Primitive
    ? K
    : T[K] extends Record<string, unknown>
      ? K | `${K}.${Paths<T[K]>}`
      : K
}[keyof T & string]

type TranslationKey = Paths<Messages>

type Translator = (key: TranslationKey) => string
