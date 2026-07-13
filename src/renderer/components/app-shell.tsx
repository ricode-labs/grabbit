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
      className={`rounded-md border px-3 py-2 ${accent ? "border-primary/25 bg-primary/10" : "bg-background"}`}
    >
      <div className="text-[11px] font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
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
    <aside className="relative z-10 flex w-[186px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-3 border-b px-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Download className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">Grabbit</div>
          <div className="text-[11px] text-muted-foreground">Download Manager</div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
        <nav className="flex flex-1 flex-col gap-1">
          <IconNav
            active={page === "tasks"}
            label="任务"
            onClick={() => onNavigate("tasks")}
            icon={<FileDown />}
          />
          <IconNav label="新建" onClick={onAddTask} icon={<Plus />} />
        </nav>
        <nav className="flex flex-col gap-1 border-t pt-3">
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
      className={`h-10 w-full justify-start gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${active ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" : ""}`}
      onClick={onClick}
    >
      <span className="flex size-4 items-center justify-center [&_svg]:size-4">{icon}</span>
      <span>{label}</span>
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
    <aside className="hidden w-[190px] shrink-0 border-r bg-muted/25 md:block">
      <div className="border-b px-4 py-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">队列</p>
        <h2 className="mt-1 text-sm font-semibold">下载空间</h2>
      </div>
      <div className="space-y-1 p-2">
        {(Object.keys(statusLabels) as TaskListStatus[]).map((item) => (
          <Button
            key={item}
            variant="ghost"
            className={`h-auto w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left transition-all ${status === item ? "bg-background text-foreground shadow-sm ring-1 ring-border hover:bg-background" : "hover:bg-background/70"}`}
            onClick={() => onStatusChange(item)}
          >
            <span className={`flex size-8 items-center justify-center rounded-md ${status === item ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground"}`}> 
              {item === "active" ? (
                <Activity />
              ) : item === "waiting" ? (
                <Loader2 />
              ) : (
                <CheckCircle2 />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{statusLabels[item]}</span>
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
    <div className="flex h-[420px] items-center justify-center border border-dashed bg-muted/20 text-center">
      <div>
        <div className="mx-auto flex size-14 items-center justify-center rounded-md bg-muted">
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
      className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm ${notice.tone === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "bg-muted"}`}
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
    <div className="fixed right-0 bottom-0 left-[186px] z-20 hidden h-9 border-t bg-background/95 px-4 shadow-sm backdrop-blur md:block">
      <div className="flex h-full items-center justify-end gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" />
          <span>下载速度</span>
          <span className="font-semibold text-foreground">{formatBytes(speed)}/s</span>
        </div>
        <div className="flex items-center gap-2">
          <span>活动任务</span>
          <span className="font-semibold text-foreground">{activeCount}</span>
        </div>
      </div>
    </div>
  )
}

