import type { Messages } from "../types"

const messages = {
  navigation: {
    tasks: "Tasks",
    queue: "Queue",
    files: "Files",
    history: "History",
    settings: "Settings",
  },
  topbar: {
    searchAria: "Search downloads",
    searchPlaceholder: "Search URL, magnet, file name, task id...",
    newTask: "New task",
  },
  tabs: {
    overview: "Overview",
    queue: "Queue",
    history: "History",
    settings: "Settings",
  },
  status: {
    downloading: "Downloading",
    queued: "Queued",
    paused: "Paused",
    seeding: "Seeding",
    completed: "Completed",
  },
  hero: {
    badge: "aria2 powered desktop downloader",
    title: "Grab files, torrents, and mirrors without losing control.",
    description:
      "A shadcn-first Grabbit workspace for active downloads, queue policy, task detail, history, and local RPC health.",
    metrics: {
      active: "active",
      done: "done",
      saved: "saved",
    },
  },
  stats: {
    download: "Download",
    upload: "Upload",
    disk: "Disk",
    rpc: "RPC",
  },
  taskPanel: {
    title: "Active downloads",
    description: "4 tasks across HTTP, magnet, and mirrored sources",
    pauseAll: "Pause all",
    columns: {
      name: "Name",
      status: "Status",
      speed: "Speed",
      eta: "ETA",
      action: "Action",
    },
    resume: "Resume",
    moreActions: "More actions",
  },
  addDialog: {
    button: "Add download",
    title: "Queue a new download",
    description: "Paste a URL, magnet link, torrent path, or metalink.",
    source: "Source",
    sourcePlaceholder: "https://... or magnet:?xt=...",
    saveTo: "Save to",
    connections: "Connections",
    cancel: "Cancel",
    queueTask: "Queue task",
  },
  taskDetails: {
    title: "Task details",
    actionLabel: "Task info",
    pause: "Pause",
    retry: "Retry",
    remove: "Remove",
  },
  quickControls: {
    title: "Quick controls",
    description: "Tune queue and network limits",
    queueLimit: "Queue limit",
    active: "active",
    downloadCap: "Download cap",
    pauseAll: "Pause all",
    resumeAll: "Resume all",
  },
  history: {
    title: "Recent history",
    description: "Completed and removed tasks",
    columns: {
      name: "Name",
      size: "Size",
      when: "When",
      status: "Status",
    },
    completed: "Completed",
  },
  settings: {
    title: "Settings",
    description: "Core aria2 and UI preferences",
    defaultFolder: "Default folder",
    rpcSecret: "RPC secret",
    language: "Language",
  },
  liveLog: {
    title: "Live log",
    description: "Recent local events",
    scopes: {
      aria2c: "aria2c",
      queue: "queue",
      disk: "disk",
      net: "net",
    },
  },
  queueSummary: {
    title: "Queue summary",
    description: "Backlog and bandwidth controls",
    waiting: "Waiting",
    tasks: "tasks",
    retryWait: "Retry wait",
    diskCache: "Disk cache",
  },
  footer: {
    serviceStatus: "aria2c running · session saved 8s ago",
  },
  languageOptions: {
    en: "English",
    "zh-CN": "简体中文",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    ja: "日本語",
    ko: "한국어",
    pt: "Português",
    ru: "Русский",
  },
} as const satisfies Messages

export default messages
