import type { Messages } from "../types"

const messages = {
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
    upload: "업로드",
    disk: "디스크",
    rpc: "RPC",
  },
  taskPanel: {
    title: "활성 다운로드",
    description: "HTTP, magnet, 미러 소스의 4개 작업",
    pauseAll: "모두 일시 중지",
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
    connections: "연결 수",
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
