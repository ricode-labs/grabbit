import type { ReactNode } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Download,
  FileDown,
  Gauge,
  Info,
  Loader2,
  Plus,
  Settings,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatBytes, statusLabels, statusMeta } from "../lib/task-display"
import type { Notice, Page } from "../lib/app-types"
import type { TaskListStatus } from "../../preload/preload"

export function MetricChip({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm backdrop-blur ${accent ? "border-primary/30 bg-primary/15" : "bg-background/45"}`}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  )
}

export function PrimaryAside({
  page,
  onNavigate,
  onAddTask,
}: {
  page: Page
  onNavigate: (page: Page) => void
  onAddTask: () => void
}) {
  return (
    <aside className="relative z-10 flex w-[92px] shrink-0 flex-col items-center p-4 pr-3 text-white">
      <div className="glass-panel flex h-full w-full flex-col items-center rounded-[28px] border border-white/10 bg-zinc-950/70 py-5 shadow-2xl">
        <div className="flex size-12 items-center justify-center rounded-3xl bg-gradient-to-br from-white to-violet-200 text-zinc-950 shadow-[0_12px_40px_rgba(124,58,237,0.35)]">
          <Download className="size-5" />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-3">
          <IconNav
            active={page === "tasks"}
            label="任务"
            onClick={() => onNavigate("tasks")}
            icon={<FileDown />}
          />
          <IconNav label="新建" onClick={onAddTask} icon={<Plus />} />
        </nav>
        <nav className="flex flex-col gap-3">
          <IconNav
            active={page === "preferences"}
            label="偏好"
            onClick={() => onNavigate("preferences")}
            icon={<Settings />}
          />
          <IconNav
            active={page === "about"}
            label="关于"
            onClick={() => onNavigate("about")}
            icon={<Info />}
          />
        </nav>
      </div>
    </aside>
  )
}

export function IconNav({
  active,
  label,
  onClick,
  icon,
}: {
  active?: boolean
  label: string
  onClick: () => void
  icon: ReactNode
}) {
  return (
    <Button
      aria-label={label}
      title={label}
      variant="ghost"
      size="icon"
      className={`size-11 rounded-2xl text-white/70 transition-all hover:bg-white/15 hover:text-white ${active ? "bg-white text-zinc-950 shadow-lg shadow-violet-500/20 hover:bg-white hover:text-zinc-950" : ""}`}
      onClick={onClick}
    >
      {icon}
    </Button>
  )
}

export function TaskSubnav({
  status,
  onStatusChange,
}: {
  status: TaskListStatus
  onStatusChange: (status: TaskListStatus) => void
}) {
  return (
    <aside className="glass-panel hidden w-[230px] shrink-0 rounded-[28px] border p-4 md:block">
      <div className="mb-6 px-2 pt-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">队列</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">下载空间</h2>
      </div>
      <div className="space-y-2">
        {(Object.keys(statusLabels) as TaskListStatus[]).map((item) => (
          <Button
            key={item}
            variant="ghost"
            className={`h-auto w-full justify-start rounded-2xl px-3 py-3 text-left transition-all ${status === item ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary hover:text-primary-foreground" : "hover:bg-background/60"}`}
            onClick={() => onStatusChange(item)}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-background/60">
              {item === "active" ? (
                <Activity />
              ) : item === "waiting" ? (
                <Loader2 />
              ) : (
                <CheckCircle2 />
              )}
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{statusLabels[item]}</span>
              <span className="mt-0.5 block truncate text-xs opacity-70">
                {statusMeta[item].caption}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </aside>
  )
}

export function EmptyTasks({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center">
      <div>
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
          <FileDown className="size-8 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-medium">暂无任务</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          点击新建任务开始下载。
        </p>
        <Button className="mt-4" onClick={onAddTask}>
          <Plus /> 新建任务
        </Button>
      </div>
    </div>
  )
}

export function NoticeBanner({
  notice,
  onClose,
}: {
  notice: Notice
  onClose: () => void
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${notice.tone === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "bg-muted"}`}
    >
      <div className="flex items-center gap-2">
        {notice.tone === "error" ? (
          <AlertCircle className="size-4" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {notice.message}
      </div>
      <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
        <X />
      </Button>
    </div>
  )
}

export function Speedometer({
  speed,
  activeCount,
}: {
  speed: number
  activeCount: number
}) {
  return (
    <div className="glass-panel fixed bottom-6 left-[108px] z-20 hidden w-[230px] rounded-3xl border p-4 shadow-2xl md:block">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <Gauge />
        </div>
        <div>
          <div className="text-sm font-semibold">{formatBytes(speed)}/s</div>
          <div className="text-xs text-muted-foreground">
            {activeCount} 个活动任务
          </div>
        </div>
      </div>
    </div>
  )
}

