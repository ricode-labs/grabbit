import type { Messages } from "../types"

const messages = {
  navigation: {
    tasks: "任务",
    queue: "队列",
    files: "文件",
    history: "历史",
    settings: "设置",
  },
  topbar: {
    searchAria: "搜索下载",
    searchPlaceholder: "搜索 URL、磁力、文件名、任务 ID...",
    newTask: "新建任务",
  },
  tabs: {
    overview: "概览",
    queue: "队列",
    history: "历史",
    settings: "设置",
  },
  status: {
    downloading: "下载中",
    queued: "排队中",
    paused: "已暂停",
    seeding: "做种中",
    completed: "已完成",
  },
  hero: {
    badge: "aria2 驱动的桌面下载器",
    title: "管理文件、种子和镜像，不丢失控制权。",
    description:
      "一个以 shadcn 为核心的 Grabbit 工作区，用于管理活跃下载、队列策略、任务详情、历史记录和本地 RPC 健康状态。",
    metrics: {
      active: "活跃",
      done: "完成",
      saved: "已保存",
    },
  },
  stats: {
    download: "下载",
    upload: "上传",
    disk: "磁盘",
    rpc: "RPC",
  },
  taskPanel: {
    title: "活跃下载",
    description: "4 个任务来自 HTTP、磁力和镜像源",
    pauseAll: "全部暂停",
    columns: {
      name: "名称",
      status: "状态",
      speed: "速度",
      eta: "预计剩余",
      action: "操作",
    },
    resume: "继续",
    moreActions: "更多操作",
  },
  addDialog: {
    button: "添加下载",
    title: "加入一个新下载",
    description: "粘贴 URL、磁力链接、种子路径或 metalink。",
    source: "来源",
    sourcePlaceholder: "https://... 或 magnet:?xt=...",
    saveTo: "保存到",
    connections: "连接数",
    cancel: "取消",
    queueTask: "加入队列",
  },
  taskDetails: {
    title: "任务详情",
    actionLabel: "任务信息",
    pause: "暂停",
    retry: "重试",
    remove: "移除",
  },
  quickControls: {
    title: "快捷控制",
    description: "调整队列和网络限制",
    queueLimit: "队列上限",
    active: "个活跃",
    downloadCap: "下载上限",
    pauseAll: "全部暂停",
    resumeAll: "全部继续",
  },
  history: {
    title: "最近历史",
    description: "已完成和已移除的任务",
    columns: {
      name: "名称",
      size: "大小",
      when: "时间",
      status: "状态",
    },
    completed: "已完成",
  },
  settings: {
    title: "设置",
    description: "aria2 核心与界面偏好",
    defaultFolder: "默认文件夹",
    rpcSecret: "RPC 密钥",
    language: "语言",
  },
  liveLog: {
    title: "实时日志",
    description: "最近的本地事件",
    scopes: {
      aria2c: "aria2c",
      queue: "队列",
      disk: "磁盘",
      net: "网络",
    },
  },
  queueSummary: {
    title: "队列概览",
    description: "积压和带宽控制",
    waiting: "等待中",
    tasks: "个任务",
    retryWait: "重试等待",
    diskCache: "磁盘缓存",
  },
  footer: {
    serviceStatus: "aria2c 正在运行 · 会话已在 8 秒前保存",
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
