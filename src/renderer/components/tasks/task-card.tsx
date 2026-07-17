import {
  Clipboard,
  FileText,
  Folder,
  MoreHorizontal,
  Pause,
  Play,
  RotateCw,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import {
  type Aria2Task,
  formatBytes,
  getProgress,
  getTaskName,
  statusText,
  statusVariant,
  type TaskStatus,
} from "../../lib/task-display"

export function TaskCard({
  task,
  selected,
  onSelectedChange,
  onShowDetails,
  onCopyLinks,
  onOpenPath,
  onAction,
}: {
  task: Aria2Task
  selected: boolean
  onSelectedChange: (checked: boolean) => void
  onShowDetails: (task: Aria2Task) => void
  onCopyLinks: (task: Aria2Task) => Promise<void>
  onOpenPath: (targetPath: string) => Promise<void>
  onAction: (
    task: Aria2Task,
    action: "pause" | "resume" | "remove" | "restart"
  ) => Promise<void>
}) {
  const progress = getProgress(task)
  const taskPath = task.files?.[0]?.path || task.dir
  const taskStatus = task.status as TaskStatus

  return (
    <Card
      className={`aurora-card glass-panel rounded-3xl transition-all hover:-translate-y-0.5 ${selected ? "border-primary shadow-primary/20" : ""}`}
    >
      <CardContent className="relative p-5">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange(checked === true)}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-base leading-6 font-semibold tracking-tight break-all">
                  {getTaskName(task)}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={statusVariant[taskStatus] ?? "outline"}>
                    {statusText[taskStatus] ?? task.status}
                  </Badge>
                  <span>
                    {formatBytes(task.completedLength)} /{" "}
                    {formatBytes(task.totalLength)}
                  </span>
                  <span>{formatBytes(task.downloadSpeed)}/s</span>
                  <span>{task.connections || "0"} 连接</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {task.status === "active" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void onAction(task, "pause")}
                    title="暂停"
                  >
                    <Pause />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void onAction(task, "resume")}
                    title="开始"
                  >
                    <Play />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onShowDetails(task)}>
                      <FileText /> 查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void onCopyLinks(task)}>
                      <Clipboard /> 复制链接
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void onOpenPath(taskPath)}>
                      <Folder /> 打开位置
                    </DropdownMenuItem>
                    {task.status === "complete" ||
                    task.status === "error" ||
                    task.status === "removed" ? (
                      <DropdownMenuItem
                        onClick={() => void onAction(task, "restart")}
                      >
                        <RotateCw /> 重新下载
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => void onAction(task, "remove")}
                    >
                      <Trash2 /> 移除任务
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="mt-5 space-y-2 rounded-2xl bg-background/45 p-3">
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}%</span>
                <span className="truncate pl-4">{taskPath}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
