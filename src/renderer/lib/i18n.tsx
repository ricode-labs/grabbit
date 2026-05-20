/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

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

type Messages = {
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

const messages: Record<Locale, Messages> = {
  en: {
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
      filters: "Filters",
      notifications: "Notifications",
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
      downloadDetail: "+12% from avg",
      upload: "Upload",
      uploadDetail: "304 peers",
      disk: "Disk",
      diskDetail: "cache active",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "Active downloads",
      description: "4 tasks across HTTP, magnet, and mirrored sources",
      pauseAll: "Pause all",
      retryFailed: "Retry failed",
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
      comment: "Comment",
      commentPlaceholder: "Optional note for this task",
      connections: "Connections",
      priority: "Priority",
      priorityPlaceholder: "Choose priority",
      low: "Low",
      normal: "Normal",
      high: "High",
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
      theme: "Theme",
      themePlaceholder: "Choose theme",
      dark: "Dark",
      light: "Light",
      system: "System",
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
      messages: {
        rpcReady: "RPC ready on 127.0.0.1",
        tasksWaiting: "2 tasks waiting for slots",
        sessionSaved: "session saved successfully",
        peerCount: "peer count steady at 304",
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
      traffic: "Down 51 MB/s · Up 8.2 MB/s · 304 peers · 5 active",
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
  },
  "zh-CN": {
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
      filters: "筛选",
      notifications: "通知",
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
      downloadDetail: "较平均值高 12%",
      upload: "上传",
      uploadDetail: "304 个节点",
      disk: "磁盘",
      diskDetail: "缓存已启用",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "活跃下载",
      description: "4 个任务来自 HTTP、磁力和镜像源",
      pauseAll: "全部暂停",
      retryFailed: "重试失败项",
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
      comment: "备注",
      commentPlaceholder: "可选任务说明",
      connections: "连接数",
      priority: "优先级",
      priorityPlaceholder: "选择优先级",
      low: "低",
      normal: "中",
      high: "高",
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
      theme: "主题",
      themePlaceholder: "选择主题",
      dark: "深色",
      light: "浅色",
      system: "跟随系统",
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
      messages: {
        rpcReady: "RPC 已在 127.0.0.1 就绪",
        tasksWaiting: "2 个任务正在等待空位",
        sessionSaved: "会话已成功保存",
        peerCount: "节点数稳定在 304",
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
      traffic: "下行 51 MB/s · 上行 8.2 MB/s · 304 个节点 · 5 个活跃任务",
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
  },
  es: {
    navigation: {
      tasks: "Tareas",
      queue: "Cola",
      files: "Archivos",
      history: "Historial",
      settings: "Ajustes",
    },
    topbar: {
      searchAria: "Buscar descargas",
      searchPlaceholder: "Buscar URL, magnet, nombre de archivo, ID de tarea...",
      newTask: "Nueva tarea",
      filters: "Filtros",
      notifications: "Notificaciones",
    },
    tabs: {
      overview: "Resumen",
      queue: "Cola",
      history: "Historial",
      settings: "Ajustes",
    },
    status: {
      downloading: "Descargando",
      queued: "En cola",
      paused: "Pausado",
      seeding: "Compartiendo",
      completed: "Completado",
    },
    hero: {
      badge: "Descargador de escritorio con aria2",
      title: "Descarga archivos, torrents y mirrors sin perder el control.",
      description:
        "Un espacio de Grabbit centrado en shadcn para descargas activas, política de cola, detalle de tareas, historial y salud local de RPC.",
      metrics: {
        active: "activas",
        done: "hechas",
        saved: "guardados",
      },
    },
    stats: {
      download: "Descarga",
      downloadDetail: "+12% sobre el promedio",
      upload: "Subida",
      uploadDetail: "304 pares",
      disk: "Disco",
      diskDetail: "caché activa",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "Descargas activas",
      description: "4 tareas en HTTP, magnet y fuentes espejo",
      pauseAll: "Pausar todo",
      retryFailed: "Reintentar fallidas",
      columns: {
        name: "Nombre",
        status: "Estado",
        speed: "Velocidad",
        eta: "ETA",
        action: "Acción",
      },
      resume: "Reanudar",
      moreActions: "Más acciones",
    },
    addDialog: {
      button: "Agregar descarga",
      title: "Poner una nueva descarga en cola",
      description: "Pega una URL, enlace magnet, ruta torrent o metalink.",
      source: "Origen",
      sourcePlaceholder: "https://... o magnet:?xt=...",
      saveTo: "Guardar en",
      comment: "Comentario",
      commentPlaceholder: "Nota opcional para esta tarea",
      connections: "Conexiones",
      priority: "Prioridad",
      priorityPlaceholder: "Elegir prioridad",
      low: "Baja",
      normal: "Normal",
      high: "Alta",
      cancel: "Cancelar",
      queueTask: "Poner en cola",
    },
    taskDetails: {
      title: "Detalles de la tarea",
      actionLabel: "Información",
      pause: "Pausar",
      retry: "Reintentar",
      remove: "Eliminar",
    },
    quickControls: {
      title: "Controles rápidos",
      description: "Ajusta la cola y los límites de red",
      queueLimit: "Límite de cola",
      active: "activas",
      downloadCap: "Límite de descarga",
      pauseAll: "Pausar todo",
      resumeAll: "Reanudar todo",
    },
    history: {
      title: "Historial reciente",
      description: "Tareas completadas y eliminadas",
      columns: {
        name: "Nombre",
        size: "Tamaño",
        when: "Cuándo",
        status: "Estado",
      },
      completed: "Completado",
    },
    settings: {
      title: "Ajustes",
      description: "Preferencias principales de aria2 y la interfaz",
      theme: "Tema",
      themePlaceholder: "Elegir tema",
      dark: "Oscuro",
      light: "Claro",
      system: "Sistema",
      defaultFolder: "Carpeta predeterminada",
      rpcSecret: "Secreto RPC",
      language: "Idioma",
    },
    liveLog: {
      title: "Registro en vivo",
      description: "Eventos locales recientes",
      scopes: {
        aria2c: "aria2c",
        queue: "cola",
        disk: "disco",
        net: "red",
      },
      messages: {
        rpcReady: "RPC listo en 127.0.0.1",
        tasksWaiting: "2 tareas esperando ranuras",
        sessionSaved: "sesión guardada correctamente",
        peerCount: "el número de pares se mantiene en 304",
      },
    },
    queueSummary: {
      title: "Resumen de cola",
      description: "Control de acumulación y ancho de banda",
      waiting: "Esperando",
      tasks: "tareas",
      retryWait: "Espera de reintento",
      diskCache: "Caché de disco",
    },
    footer: {
      serviceStatus: "aria2c en ejecución · sesión guardada hace 8 s",
      traffic: "Bajada 51 MB/s · Subida 8.2 MB/s · 304 pares · 5 activas",
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
  },
  fr: {
    navigation: {
      tasks: "Tâches",
      queue: "File",
      files: "Fichiers",
      history: "Historique",
      settings: "Réglages",
    },
    topbar: {
      searchAria: "Rechercher des téléchargements",
      searchPlaceholder: "Rechercher URL, magnet, nom de fichier, ID de tâche...",
      newTask: "Nouvelle tâche",
      filters: "Filtres",
      notifications: "Notifications",
    },
    tabs: {
      overview: "Vue d'ensemble",
      queue: "File",
      history: "Historique",
      settings: "Réglages",
    },
    status: {
      downloading: "Téléchargement",
      queued: "En file",
      paused: "En pause",
      seeding: "Partage",
      completed: "Terminé",
    },
    hero: {
      badge: "Téléchargeur de bureau propulsé par aria2",
      title: "Gérez fichiers, torrents et miroirs sans perdre le contrôle.",
      description:
        "Un espace de travail Grabbit centré sur shadcn pour les téléchargements actifs, la politique de file, le détail des tâches, l'historique et la santé RPC locale.",
      metrics: {
        active: "actives",
        done: "terminées",
        saved: "sauvegardés",
      },
    },
    stats: {
      download: "Téléchargement",
      downloadDetail: "+12 % par rapport à la moyenne",
      upload: "Envoi",
      uploadDetail: "304 pairs",
      disk: "Disque",
      diskDetail: "cache actif",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "Téléchargements actifs",
      description: "4 tâches via HTTP, magnet et sources miroir",
      pauseAll: "Tout mettre en pause",
      retryFailed: "Réessayer les échecs",
      columns: {
        name: "Nom",
        status: "État",
        speed: "Vitesse",
        eta: "ETA",
        action: "Action",
      },
      resume: "Reprendre",
      moreActions: "Plus d'actions",
    },
    addDialog: {
      button: "Ajouter un téléchargement",
      title: "Mettre un nouveau téléchargement en file",
      description: "Collez une URL, un lien magnet, un chemin torrent ou un metalink.",
      source: "Source",
      sourcePlaceholder: "https://... ou magnet:?xt=...",
      saveTo: "Enregistrer dans",
      comment: "Commentaire",
      commentPlaceholder: "Note facultative pour cette tâche",
      connections: "Connexions",
      priority: "Priorité",
      priorityPlaceholder: "Choisir la priorité",
      low: "Basse",
      normal: "Normale",
      high: "Haute",
      cancel: "Annuler",
      queueTask: "Mettre en file",
    },
    taskDetails: {
      title: "Détails de la tâche",
      actionLabel: "Infos",
      pause: "Pause",
      retry: "Réessayer",
      remove: "Supprimer",
    },
    quickControls: {
      title: "Contrôles rapides",
      description: "Ajustez la file et les limites réseau",
      queueLimit: "Limite de file",
      active: "actives",
      downloadCap: "Limite de téléchargement",
      pauseAll: "Tout mettre en pause",
      resumeAll: "Tout reprendre",
    },
    history: {
      title: "Historique récent",
      description: "Tâches terminées et supprimées",
      columns: {
        name: "Nom",
        size: "Taille",
        when: "Quand",
        status: "État",
      },
      completed: "Terminé",
    },
    settings: {
      title: "Réglages",
      description: "Préférences aria2 et interface principales",
      theme: "Thème",
      themePlaceholder: "Choisir un thème",
      dark: "Sombre",
      light: "Clair",
      system: "Système",
      defaultFolder: "Dossier par défaut",
      rpcSecret: "Secret RPC",
      language: "Langue",
    },
    liveLog: {
      title: "Journal en direct",
      description: "Événements locaux récents",
      scopes: {
        aria2c: "aria2c",
        queue: "file",
        disk: "disque",
        net: "réseau",
      },
      messages: {
        rpcReady: "RPC prêt sur 127.0.0.1",
        tasksWaiting: "2 tâches en attente de créneaux",
        sessionSaved: "session enregistrée avec succès",
        peerCount: "le nombre de pairs reste à 304",
      },
    },
    queueSummary: {
      title: "Résumé de la file",
      description: "Contrôle du backlog et de la bande passante",
      waiting: "En attente",
      tasks: "tâches",
      retryWait: "Délai de reprise",
      diskCache: "Cache disque",
    },
    footer: {
      serviceStatus: "aria2c en cours · session enregistrée il y a 8 s",
      traffic: "Descente 51 MB/s · Montée 8.2 MB/s · 304 pairs · 5 actives",
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
  },
  de: {
    navigation: {
      tasks: "Aufgaben",
      queue: "Warteschlange",
      files: "Dateien",
      history: "Verlauf",
      settings: "Einstellungen",
    },
    topbar: {
      searchAria: "Downloads suchen",
      searchPlaceholder: "URL, Magnet, Dateiname, Aufgaben-ID suchen...",
      newTask: "Neue Aufgabe",
      filters: "Filter",
      notifications: "Benachrichtigungen",
    },
    tabs: {
      overview: "Übersicht",
      queue: "Warteschlange",
      history: "Verlauf",
      settings: "Einstellungen",
    },
    status: {
      downloading: "Lädt herunter",
      queued: "In Warteschlange",
      paused: "Pausiert",
      seeding: "Sament",
      completed: "Abgeschlossen",
    },
    hero: {
      badge: "aria2-gestützter Desktop-Downloader",
      title: "Dateien, Torrents und Mirrors holen, ohne die Kontrolle zu verlieren.",
      description:
        "Ein shadcn-zentrierter Grabbit-Arbeitsbereich für aktive Downloads, Warteschlangenregeln, Aufgabendetails, Verlauf und lokale RPC-Gesundheit.",
      metrics: {
        active: "aktiv",
        done: "fertig",
        saved: "gespeichert",
      },
    },
    stats: {
      download: "Download",
      downloadDetail: "+12 % über dem Durchschnitt",
      upload: "Upload",
      uploadDetail: "304 Peers",
      disk: "Datenträger",
      diskDetail: "Cache aktiv",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "Aktive Downloads",
      description: "4 Aufgaben über HTTP, Magnet und Mirror-Quellen",
      pauseAll: "Alle pausieren",
      retryFailed: "Fehlgeschlagene erneut versuchen",
      columns: {
        name: "Name",
        status: "Status",
        speed: "Geschwindigkeit",
        eta: "ETA",
        action: "Aktion",
      },
      resume: "Fortsetzen",
      moreActions: "Weitere Aktionen",
    },
    addDialog: {
      button: "Download hinzufügen",
      title: "Neuen Download in die Warteschlange stellen",
      description: "Fügen Sie eine URL, einen Magnet-Link, einen Torrent-Pfad oder ein Metalink ein.",
      source: "Quelle",
      sourcePlaceholder: "https://... oder magnet:?xt=...",
      saveTo: "Speichern in",
      comment: "Kommentar",
      commentPlaceholder: "Optionale Notiz für diese Aufgabe",
      connections: "Verbindungen",
      priority: "Priorität",
      priorityPlaceholder: "Priorität wählen",
      low: "Niedrig",
      normal: "Normal",
      high: "Hoch",
      cancel: "Abbrechen",
      queueTask: "In Warteschlange",
    },
    taskDetails: {
      title: "Aufgabendetails",
      actionLabel: "Aufgabeninfo",
      pause: "Pause",
      retry: "Wiederholen",
      remove: "Entfernen",
    },
    quickControls: {
      title: "Schnellsteuerung",
      description: "Warteschlange und Netzwerklimits anpassen",
      queueLimit: "Warteschlangenlimit",
      active: "aktiv",
      downloadCap: "Download-Limit",
      pauseAll: "Alle pausieren",
      resumeAll: "Alle fortsetzen",
    },
    history: {
      title: "Letzter Verlauf",
      description: "Abgeschlossene und entfernte Aufgaben",
      columns: {
        name: "Name",
        size: "Größe",
        when: "Wann",
        status: "Status",
      },
      completed: "Abgeschlossen",
    },
    settings: {
      title: "Einstellungen",
      description: "Kern-aria2- und UI-Einstellungen",
      theme: "Design",
      themePlaceholder: "Design wählen",
      dark: "Dunkel",
      light: "Hell",
      system: "System",
      defaultFolder: "Standardordner",
      rpcSecret: "RPC-Geheimnis",
      language: "Sprache",
    },
    liveLog: {
      title: "Live-Protokoll",
      description: "Kürzliche lokale Ereignisse",
      scopes: {
        aria2c: "aria2c",
        queue: "warteschlange",
        disk: "datenträger",
        net: "netzwerk",
      },
      messages: {
        rpcReady: "RPC bereit auf 127.0.0.1",
        tasksWaiting: "2 Aufgaben warten auf Slots",
        sessionSaved: "Sitzung erfolgreich gespeichert",
        peerCount: "Peer-Anzahl stabil bei 304",
      },
    },
    queueSummary: {
      title: "Warteschlangenübersicht",
      description: "Backlog- und Bandbreitensteuerung",
      waiting: "Wartend",
      tasks: "Aufgaben",
      retryWait: "Wiederholungswartezeit",
      diskCache: "Datenträgercache",
    },
    footer: {
      serviceStatus: "aria2c läuft · Sitzung vor 8 s gespeichert",
      traffic: "Runter 51 MB/s · Hoch 8.2 MB/s · 304 Peers · 5 aktiv",
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
  },
  ja: {
    navigation: {
      tasks: "タスク",
      queue: "キュー",
      files: "ファイル",
      history: "履歴",
      settings: "設定",
    },
    topbar: {
      searchAria: "ダウンロードを検索",
      searchPlaceholder: "URL、magnet、ファイル名、タスク ID を検索...",
      newTask: "新しいタスク",
      filters: "フィルター",
      notifications: "通知",
    },
    tabs: {
      overview: "概要",
      queue: "キュー",
      history: "履歴",
      settings: "設定",
    },
    status: {
      downloading: "ダウンロード中",
      queued: "キュー待ち",
      paused: "一時停止",
      seeding: "シード中",
      completed: "完了",
    },
    hero: {
      badge: "aria2 搭載のデスクトップダウンローダー",
      title: "ファイル、トレント、ミラーを自在に扱う。",
      description:
        "shadcn を中心にした Grabbit の作業画面。進行中のダウンロード、キューポリシー、タスク詳細、履歴、ローカル RPC の状態をまとめて管理できます。",
      metrics: {
        active: "稼働中",
        done: "完了",
        saved: "保存",
      },
    },
    stats: {
      download: "ダウンロード",
      downloadDetail: "平均より 12% 高い",
      upload: "アップロード",
      uploadDetail: "304 ピア",
      disk: "ディスク",
      diskDetail: "キャッシュ有効",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "稼働中のダウンロード",
      description: "HTTP、magnet、ミラーソースの 4 タスク",
      pauseAll: "すべて一時停止",
      retryFailed: "失敗分を再試行",
      columns: {
        name: "名前",
        status: "状態",
        speed: "速度",
        eta: "残り時間",
        action: "操作",
      },
      resume: "再開",
      moreActions: "その他の操作",
    },
    addDialog: {
      button: "ダウンロードを追加",
      title: "新しいダウンロードをキューに追加",
      description: "URL、magnet リンク、torrent パス、または metalink を貼り付けてください。",
      source: "ソース",
      sourcePlaceholder: "https://... または magnet:?xt=...",
      saveTo: "保存先",
      comment: "コメント",
      commentPlaceholder: "このタスクの任意メモ",
      connections: "接続数",
      priority: "優先度",
      priorityPlaceholder: "優先度を選択",
      low: "低",
      normal: "通常",
      high: "高",
      cancel: "キャンセル",
      queueTask: "キューに追加",
    },
    taskDetails: {
      title: "タスクの詳細",
      actionLabel: "タスク情報",
      pause: "一時停止",
      retry: "再試行",
      remove: "削除",
    },
    quickControls: {
      title: "クイック操作",
      description: "キューとネットワーク制限を調整",
      queueLimit: "キュー上限",
      active: "稼働中",
      downloadCap: "ダウンロード上限",
      pauseAll: "すべて一時停止",
      resumeAll: "すべて再開",
    },
    history: {
      title: "最近の履歴",
      description: "完了・削除したタスク",
      columns: {
        name: "名前",
        size: "サイズ",
        when: "日時",
        status: "状態",
      },
      completed: "完了",
    },
    settings: {
      title: "設定",
      description: "aria2 と UI の基本設定",
      theme: "テーマ",
      themePlaceholder: "テーマを選択",
      dark: "ダーク",
      light: "ライト",
      system: "システム",
      defaultFolder: "既定フォルダー",
      rpcSecret: "RPC シークレット",
      language: "言語",
    },
    liveLog: {
      title: "ライブログ",
      description: "最近のローカルイベント",
      scopes: {
        aria2c: "aria2c",
        queue: "キュー",
        disk: "ディスク",
        net: "ネット",
      },
      messages: {
        rpcReady: "RPC が 127.0.0.1 で準備完了",
        tasksWaiting: "2 件のタスクがスロット待ち",
        sessionSaved: "セッションを正常に保存しました",
        peerCount: "ピア数は 304 で安定",
      },
    },
    queueSummary: {
      title: "キューの概要",
      description: "滞留と帯域幅の制御",
      waiting: "待機中",
      tasks: "件のタスク",
      retryWait: "再試行待ち",
      diskCache: "ディスクキャッシュ",
    },
    footer: {
      serviceStatus: "aria2c 実行中 · 8 秒前にセッション保存",
      traffic: "下り 51 MB/s · 上り 8.2 MB/s · 304 ピア · 5 件稼働",
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
  },
  ko: {
    navigation: {
      tasks: "작업",
      queue: "대기열",
      files: "파일",
      history: "기록",
      settings: "설정",
    },
    topbar: {
      searchAria: "다운로드 검색",
      searchPlaceholder: "URL, magnet, 파일 이름, 작업 ID 검색...",
      newTask: "새 작업",
      filters: "필터",
      notifications: "알림",
    },
    tabs: {
      overview: "개요",
      queue: "대기열",
      history: "기록",
      settings: "설정",
    },
    status: {
      downloading: "다운로드 중",
      queued: "대기 중",
      paused: "일시 중지",
      seeding: "시딩 중",
      completed: "완료됨",
    },
    hero: {
      badge: "aria2 기반 데스크톱 다운로드 도구",
      title: "파일, 토렌트, 미러를 놓치지 않고 관리하세요.",
      description:
        "활성 다운로드, 대기열 정책, 작업 세부 정보, 기록, 로컬 RPC 상태를 한곳에서 다루는 shadcn 중심의 Grabbit 작업 공간입니다.",
      metrics: {
        active: "활성",
        done: "완료",
        saved: "저장",
      },
    },
    stats: {
      download: "다운로드",
      downloadDetail: "평균 대비 12% 높음",
      upload: "업로드",
      uploadDetail: "304 피어",
      disk: "디스크",
      diskDetail: "캐시 활성",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "활성 다운로드",
      description: "HTTP, magnet, 미러 소스의 4개 작업",
      pauseAll: "모두 일시 중지",
      retryFailed: "실패 항목 재시도",
      columns: {
        name: "이름",
        status: "상태",
        speed: "속도",
        eta: "남은 시간",
        action: "작업",
      },
      resume: "재개",
      moreActions: "추가 작업",
    },
    addDialog: {
      button: "다운로드 추가",
      title: "새 다운로드를 대기열에 추가",
      description: "URL, magnet 링크, 토렌트 경로 또는 metalink를 붙여넣으세요.",
      source: "출처",
      sourcePlaceholder: "https://... 또는 magnet:?xt=...",
      saveTo: "저장 위치",
      comment: "메모",
      commentPlaceholder: "이 작업에 대한 선택 메모",
      connections: "연결 수",
      priority: "우선순위",
      priorityPlaceholder: "우선순위 선택",
      low: "낮음",
      normal: "보통",
      high: "높음",
      cancel: "취소",
      queueTask: "대기열에 추가",
    },
    taskDetails: {
      title: "작업 세부 정보",
      actionLabel: "작업 정보",
      pause: "일시 중지",
      retry: "다시 시도",
      remove: "제거",
    },
    quickControls: {
      title: "빠른 제어",
      description: "대기열과 네트워크 한도를 조정",
      queueLimit: "대기열 한도",
      active: "활성",
      downloadCap: "다운로드 제한",
      pauseAll: "모두 일시 중지",
      resumeAll: "모두 재개",
    },
    history: {
      title: "최근 기록",
      description: "완료 및 제거된 작업",
      columns: {
        name: "이름",
        size: "크기",
        when: "시각",
        status: "상태",
      },
      completed: "완료됨",
    },
    settings: {
      title: "설정",
      description: "aria2 핵심 및 UI 환경 설정",
      theme: "테마",
      themePlaceholder: "테마 선택",
      dark: "어두움",
      light: "밝음",
      system: "시스템",
      defaultFolder: "기본 폴더",
      rpcSecret: "RPC 비밀키",
      language: "언어",
    },
    liveLog: {
      title: "실시간 로그",
      description: "최근 로컬 이벤트",
      scopes: {
        aria2c: "aria2c",
        queue: "대기열",
        disk: "디스크",
        net: "네트워크",
      },
      messages: {
        rpcReady: "RPC가 127.0.0.1에서 준비됨",
        tasksWaiting: "2개의 작업이 슬롯을 기다리는 중",
        sessionSaved: "세션이 성공적으로 저장됨",
        peerCount: "피어 수가 304로 안정적",
      },
    },
    queueSummary: {
      title: "대기열 요약",
      description: "적체와 대역폭 제어",
      waiting: "대기 중",
      tasks: "개 작업",
      retryWait: "재시도 대기",
      diskCache: "디스크 캐시",
    },
    footer: {
      serviceStatus: "aria2c 실행 중 · 8초 전에 세션 저장",
      traffic: "다운 51 MB/s · 업 8.2 MB/s · 304 피어 · 5개 활성",
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
  },
  pt: {
    navigation: {
      tasks: "Tarefas",
      queue: "Fila",
      files: "Arquivos",
      history: "Histórico",
      settings: "Configurações",
    },
    topbar: {
      searchAria: "Pesquisar downloads",
      searchPlaceholder: "Pesquisar URL, magnet, nome de arquivo, ID da tarefa...",
      newTask: "Nova tarefa",
      filters: "Filtros",
      notifications: "Notificações",
    },
    tabs: {
      overview: "Visão geral",
      queue: "Fila",
      history: "Histórico",
      settings: "Configurações",
    },
    status: {
      downloading: "Baixando",
      queued: "Na fila",
      paused: "Pausado",
      seeding: "Compartilhando",
      completed: "Concluído",
    },
    hero: {
      badge: "Downloader para desktop com aria2",
      title: "Baixe arquivos, torrents e mirrors sem perder o controle.",
      description:
        "Um espaço de trabalho Grabbit centrado em shadcn para downloads ativos, política de fila, detalhes de tarefas, histórico e saúde local do RPC.",
      metrics: {
        active: "ativas",
        done: "concluídas",
        saved: "salvos",
      },
    },
    stats: {
      download: "Download",
      downloadDetail: "+12% acima da média",
      upload: "Upload",
      uploadDetail: "304 pares",
      disk: "Disco",
      diskDetail: "cache ativo",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "Downloads ativos",
      description: "4 tarefas em HTTP, magnet e espelhos",
      pauseAll: "Pausar tudo",
      retryFailed: "Tentar novamente as falhas",
      columns: {
        name: "Nome",
        status: "Status",
        speed: "Velocidade",
        eta: "ETA",
        action: "Ação",
      },
      resume: "Retomar",
      moreActions: "Mais ações",
    },
    addDialog: {
      button: "Adicionar download",
      title: "Colocar um novo download na fila",
      description: "Cole uma URL, link magnet, caminho torrent ou metalink.",
      source: "Origem",
      sourcePlaceholder: "https://... ou magnet:?xt=...",
      saveTo: "Salvar em",
      comment: "Comentário",
      commentPlaceholder: "Nota opcional para esta tarefa",
      connections: "Conexões",
      priority: "Prioridade",
      priorityPlaceholder: "Escolher prioridade",
      low: "Baixa",
      normal: "Normal",
      high: "Alta",
      cancel: "Cancelar",
      queueTask: "Colocar na fila",
    },
    taskDetails: {
      title: "Detalhes da tarefa",
      actionLabel: "Informações",
      pause: "Pausar",
      retry: "Tentar novamente",
      remove: "Remover",
    },
    quickControls: {
      title: "Controles rápidos",
      description: "Ajuste fila e limites de rede",
      queueLimit: "Limite da fila",
      active: "ativas",
      downloadCap: "Limite de download",
      pauseAll: "Pausar tudo",
      resumeAll: "Retomar tudo",
    },
    history: {
      title: "Histórico recente",
      description: "Tarefas concluídas e removidas",
      columns: {
        name: "Nome",
        size: "Tamanho",
        when: "Quando",
        status: "Status",
      },
      completed: "Concluído",
    },
    settings: {
      title: "Configurações",
      description: "Preferências centrais do aria2 e da interface",
      theme: "Tema",
      themePlaceholder: "Escolher tema",
      dark: "Escuro",
      light: "Claro",
      system: "Sistema",
      defaultFolder: "Pasta padrão",
      rpcSecret: "Segredo RPC",
      language: "Idioma",
    },
    liveLog: {
      title: "Log ao vivo",
      description: "Eventos locais recentes",
      scopes: {
        aria2c: "aria2c",
        queue: "fila",
        disk: "disco",
        net: "rede",
      },
      messages: {
        rpcReady: "RPC pronto em 127.0.0.1",
        tasksWaiting: "2 tarefas aguardando vagas",
        sessionSaved: "sessão salva com sucesso",
        peerCount: "a contagem de pares estável em 304",
      },
    },
    queueSummary: {
      title: "Resumo da fila",
      description: "Controle de backlog e largura de banda",
      waiting: "Aguardando",
      tasks: "tarefas",
      retryWait: "Aguardar nova tentativa",
      diskCache: "Cache de disco",
    },
    footer: {
      serviceStatus: "aria2c em execução · sessão salva há 8 s",
      traffic: "Download 51 MB/s · Upload 8.2 MB/s · 304 pares · 5 ativas",
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
  },
  ru: {
    navigation: {
      tasks: "Задачи",
      queue: "Очередь",
      files: "Файлы",
      history: "История",
      settings: "Настройки",
    },
    topbar: {
      searchAria: "Поиск загрузок",
      searchPlaceholder: "Поиск URL, magnet, имени файла, ID задачи...",
      newTask: "Новая задача",
      filters: "Фильтры",
      notifications: "Уведомления",
    },
    tabs: {
      overview: "Обзор",
      queue: "Очередь",
      history: "История",
      settings: "Настройки",
    },
    status: {
      downloading: "Загружается",
      queued: "В очереди",
      paused: "Пауза",
      seeding: "Раздача",
      completed: "Завершено",
    },
    hero: {
      badge: "Настольный загрузчик на aria2",
      title: "Забирайте файлы, торренты и зеркала без потери контроля.",
      description:
        "Рабочее пространство Grabbit на базе shadcn для активных загрузок, политики очереди, деталей задач, истории и локального состояния RPC.",
      metrics: {
        active: "активны",
        done: "готово",
        saved: "сохранено",
      },
    },
    stats: {
      download: "Загрузка",
      downloadDetail: "+12% к среднему",
      upload: "Отдача",
      uploadDetail: "304 пира",
      disk: "Диск",
      diskDetail: "кэш активен",
      rpc: "RPC",
      rpcDetail: "127.0.0.1",
    },
    taskPanel: {
      title: "Активные загрузки",
      description: "4 задачи по HTTP, magnet и зеркалам",
      pauseAll: "Приостановить всё",
      retryFailed: "Повторить неудачные",
      columns: {
        name: "Имя",
        status: "Статус",
        speed: "Скорость",
        eta: "ETA",
        action: "Действие",
      },
      resume: "Возобновить",
      moreActions: "Ещё действия",
    },
    addDialog: {
      button: "Добавить загрузку",
      title: "Поставить новую загрузку в очередь",
      description: "Вставьте URL, magnet-ссылку, путь к torrent или metalink.",
      source: "Источник",
      sourcePlaceholder: "https://... или magnet:?xt=...",
      saveTo: "Сохранить в",
      comment: "Комментарий",
      commentPlaceholder: "Необязательная заметка для этой задачи",
      connections: "Соединения",
      priority: "Приоритет",
      priorityPlaceholder: "Выберите приоритет",
      low: "Низкий",
      normal: "Обычный",
      high: "Высокий",
      cancel: "Отмена",
      queueTask: "В очередь",
    },
    taskDetails: {
      title: "Сведения о задаче",
      actionLabel: "Информация",
      pause: "Пауза",
      retry: "Повторить",
      remove: "Удалить",
    },
    quickControls: {
      title: "Быстрые действия",
      description: "Настройка очереди и лимитов сети",
      queueLimit: "Лимит очереди",
      active: "активны",
      downloadCap: "Лимит загрузки",
      pauseAll: "Приостановить всё",
      resumeAll: "Возобновить всё",
    },
    history: {
      title: "Недавняя история",
      description: "Завершённые и удалённые задачи",
      columns: {
        name: "Имя",
        size: "Размер",
        when: "Когда",
        status: "Статус",
      },
      completed: "Завершено",
    },
    settings: {
      title: "Настройки",
      description: "Основные параметры aria2 и интерфейса",
      theme: "Тема",
      themePlaceholder: "Выберите тему",
      dark: "Тёмная",
      light: "Светлая",
      system: "Система",
      defaultFolder: "Папка по умолчанию",
      rpcSecret: "Секрет RPC",
      language: "Язык",
    },
    liveLog: {
      title: "Журнал в реальном времени",
      description: "Недавние локальные события",
      scopes: {
        aria2c: "aria2c",
        queue: "очередь",
        disk: "диск",
        net: "сеть",
      },
      messages: {
        rpcReady: "RPC готов на 127.0.0.1",
        tasksWaiting: "2 задачи ждут слотов",
        sessionSaved: "сеанс успешно сохранён",
        peerCount: "число пиров стабильно на 304",
      },
    },
    queueSummary: {
      title: "Сводка очереди",
      description: "Управление накоплением и пропускной способностью",
      waiting: "Ожидают",
      tasks: "задачи",
      retryWait: "Ожидание повтора",
      diskCache: "Дисковый кэш",
    },
    footer: {
      serviceStatus: "aria2c запущен · сеанс сохранён 8 с назад",
      traffic: "Скач. 51 MB/s · Отд. 8.2 MB/s · 304 пира · 5 активных",
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
  },
}

const storageKey = "grabbit.locale"

function isLocale(value: string): value is Locale {
  return (supportedLocales as readonly string[]).includes(value)
}

function resolveLocale() {
  if (typeof window === "undefined") {
    return "en"
  }

  const stored = window.localStorage.getItem(storageKey)
  if (stored && isLocale(stored)) {
    return stored
  }

  const candidates = [navigator.language, ...navigator.languages]
    .filter(Boolean)
    .map((value) => value.toLowerCase())

  for (const candidate of candidates) {
    if (candidate.startsWith("zh")) return "zh-CN"
    if (candidate.startsWith("es")) return "es"
    if (candidate.startsWith("fr")) return "fr"
    if (candidate.startsWith("de")) return "de"
    if (candidate.startsWith("ja")) return "ja"
    if (candidate.startsWith("ko")) return "ko"
    if (candidate.startsWith("pt")) return "pt"
    if (candidate.startsWith("ru")) return "ru"
    if (candidate.startsWith("en")) return "en"
  }

  return "en"
}

type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Messages
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(resolveLocale)

  useEffect(() => {
    window.localStorage.setItem(storageKey, locale)
    document.documentElement.lang = locale
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: messages[locale] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const value = useContext(I18nContext)

  if (!value) {
    throw new Error("useI18n must be used within I18nProvider")
  }

  return value
}
