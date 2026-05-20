import type { Messages } from "../types"

const messages = {
  navigation: {
    tasks: "Tarefas",
    queue: "Fila",
    files: "Arquivos",
    history: "Histórico",
    settings: "Configurações",
  },
  topbar: {
    searchAria: "Pesquisar downloads",
    searchPlaceholder:
      "Pesquisar URL, magnet, nome de arquivo, ID da tarefa...",
    newTask: "Nova tarefa",
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
    upload: "Upload",
    disk: "Disco",
    rpc: "RPC",
  },
  taskPanel: {
    title: "Downloads ativos",
    description: "4 tarefas em HTTP, magnet e espelhos",
    pauseAll: "Pausar tudo",
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
    connections: "Conexões",
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
