import type { Messages } from "../types"

const messages = {
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
    upload: "Subida",
    disk: "Disco",
    rpc: "RPC",
  },
  taskPanel: {
    title: "Descargas activas",
    description: "4 tareas en HTTP, magnet y fuentes espejo",
    pauseAll: "Pausar todo",
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
    connections: "Conexiones",
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
