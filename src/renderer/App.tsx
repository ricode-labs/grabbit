import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Download,
  FileDown,
  Folder,
  Gauge,
  Info,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCw,
  Settings,
  Trash2,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Aria2Task, TaskListStatus, TaskStatus } from "../preload/preload"

type Page = "tasks" | "preferences" | "about"

type Notice = {
  tone: "success" | "error" | "info"
  message: string
}

type AddTaskForm = {
  uris: string
  out: string
  split: number
  dir: string
  userAgent: string
  authorization: string
  referer: string
  cookie: string
  allProxy: string
  showDownloading: boolean
}

const initialForm: AddTaskForm = {
  uris: "",
  out: "",
  split: 16,
  dir: "",
  userAgent: "",
  authorization: "",
  referer: "",
  cookie: "",
  allProxy: "",
  showDownloading: true,
}

const statusLabels: Record<TaskListStatus, string> = {
  active: "正在下载",
  waiting: "等待中",
  stopped: "已停止",
}

const statusVariant: Record<TaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  waiting: "secondary",
  paused: "outline",
  complete: "secondary",
  error: "destructive",
  removed: "outline",
}

const statusText: Record<TaskStatus, string> = {
  active: "下载中",
  waiting: "等待中",
  paused: "已暂停",
  complete: "已完成",
  error: "错误",
  removed: "已移除",
}

function getTaskName(task: Aria2Task) {
  const firstPath = task.files?.[0]?.path
  if (!firstPath) {
    return task.gid
  }

  return firstPath.split(/[\\/]/).filter(Boolean).at(-1) ?? task.gid
}

function toNumber(value: string | number | undefined) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function formatBytes(bytes: string | number | undefined) {
  const value = toNumber(bytes)
  if (value <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function getProgress(task: Aria2Task) {
  const total = toNumber(task.totalLength)
  if (total <= 0) {
    return 0
  }

  return Math.min(100, Math.round((toNumber(task.completedLength) / total) * 100))
}

function buildOptions(form: AddTaskForm) {
  return {
    out: form.out,
    split: form.split,
    dir: form.dir,
    userAgent: form.userAgent,
    header: [
      form.authorization ? `Authorization: ${form.authorization}` : "",
      form.referer ? `Referer: ${form.referer}` : "",
      form.cookie ? `Cookie: ${form.cookie}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    allProxy: form.allProxy,
  }
}

export function App() {
  const [page, setPage] = useState<Page>("tasks")
  const [status, setStatus] = useState<TaskListStatus>("active")
  const [tasks, setTasks] = useState<Aria2Task[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [form, setForm] = useState<AddTaskForm>(initialForm)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<Notice | null>(null)
  const [addTaskError, setAddTaskError] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const nextTasks = await window.grabbit.listTasks(status)
      setTasks(nextTasks)
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "读取任务列表失败",
      })
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void window.grabbit.getDefaultDir().then((dir) => {
      setForm((current) => ({ ...current, dir }))
    })
  }, [])

  useEffect(() => {
    const load = () => {
      void loadTasks()
    }
    load()
    const timer = window.setInterval(load, 2000)
    return () => window.clearInterval(timer)
  }, [loadTasks])

  const totalSpeed = useMemo(
    () => tasks.reduce((sum, task) => sum + toNumber(task.downloadSpeed), 0),
    [tasks]
  )

  const submitTask = async () => {
    const uris = form.uris
      .split(/\n+/)
      .map((uri) => uri.trim())
      .filter(Boolean)

    if (uris.length === 0) {
      setAddTaskError("请输入至少一个下载链接")
      return
    }

    try {
      await window.grabbit.addUri({ uris, options: buildOptions(form) })
      setAddTaskError(null)
      setNotice({ tone: "success", message: "任务已添加" })
      setAddOpen(false)
      setForm((current) => ({ ...initialForm, dir: current.dir }))
      if (form.showDownloading) {
        setStatus("active")
      }
      await loadTasks()
    } catch (error) {
      setAddTaskError(error instanceof Error ? error.message : "添加任务失败")
    }
  }

  const runTaskAction = async (task: Aria2Task, action: "pause" | "resume" | "remove") => {
    try {
      if (action === "pause") {
        await window.grabbit.pauseTask(task.gid)
      } else if (action === "resume") {
        await window.grabbit.resumeTask(task.gid)
      } else if (task.status === "complete" || task.status === "error" || task.status === "removed") {
        await window.grabbit.removeTaskResult(task.gid)
      } else {
        await window.grabbit.removeTask(task.gid)
      }

      await loadTasks()
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "操作失败",
      })
    }
  }

  const runBatchAction = async (action: "pause" | "resume" | "remove") => {
    const selectedTasks = tasks.filter((task) => selected.has(task.gid))
    for (const task of selectedTasks) {
      await runTaskAction(task, action)
    }
    setSelected(new Set())
  }

  const chooseDirectory = async () => {
    const directory = await window.grabbit.selectDirectory()
    if (directory) {
      setForm((current) => ({ ...current, dir: directory }))
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <PrimaryAside page={page} onNavigate={setPage} onAddTask={() => setAddOpen(true)} />

      {page === "tasks" ? (
        <main className="flex min-w-0 flex-1 bg-muted/30">
          <TaskSubnav
            status={status}
            onStatusChange={(nextStatus) => {
              setSelected(new Set())
              setStatus(nextStatus)
            }}
          />
          <section className="flex min-w-0 flex-1 flex-col border-l bg-background/95">
            <header className="flex h-[84px] items-center justify-between border-b px-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{statusLabels[status]}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tasks.length} 个任务 · 当前速度 {formatBytes(totalSpeed)}/s
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void loadTasks()} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <RotateCw />}
                  刷新
                </Button>
                <Button variant="outline" size="sm" onClick={() => void window.grabbit.pauseAll().then(loadTasks)}>
                  <Pause />
                  全部暂停
                </Button>
                <Button variant="outline" size="sm" onClick={() => void window.grabbit.resumeAll().then(loadTasks)}>
                  <Play />
                  全部开始
                </Button>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus />
                  新建任务
                </Button>
              </div>
            </header>

            {selected.size > 0 ? (
              <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-2 text-sm">
                <span>已选择 {selected.size} 个任务</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void runBatchAction("pause")}>暂停</Button>
                  <Button variant="outline" size="sm" onClick={() => void runBatchAction("resume")}>开始</Button>
                  <Button variant="destructive" size="sm" onClick={() => void runBatchAction("remove")}>移除</Button>
                </div>
              </div>
            ) : null}

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 p-4 pb-24">
                {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}
                {loading && tasks.length === 0 ? (
                  <div className="flex h-72 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 animate-spin" /> 正在读取 aria2 任务...
                  </div>
                ) : tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.gid}
                      task={task}
                      selected={selected.has(task.gid)}
                      onSelectedChange={(checked) => {
                        setSelected((current) => {
                          const next = new Set(current)
                          if (checked) {
                            next.add(task.gid)
                          } else {
                            next.delete(task.gid)
                          }
                          return next
                        })
                      }}
                      onAction={runTaskAction}
                    />
                  ))
                ) : (
                  <EmptyTasks onAddTask={() => setAddOpen(true)} />
                )}
              </div>
            </ScrollArea>
          </section>
        </main>
      ) : null}

      {page === "preferences" ? <PreferencesPage /> : null}
      {page === "about" ? <AboutPage /> : null}

      <Speedometer speed={totalSpeed} activeCount={tasks.filter((task) => task.status === "active").length} />

      <Dialog open={addOpen} onOpenChange={(open) => {
        setAddOpen(open)
        if (!open) {
          setAddTaskError(null)
        }
      }}>
        <DialogContent className="flex h-[88vh] w-[min(720px,calc(100vw-2rem))] max-w-none grid-rows-none flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 p-4 pb-0">
            <DialogTitle>新建下载任务</DialogTitle>
            <DialogDescription>支持 HTTP、HTTPS、FTP、磁力链接。每行一个链接。</DialogDescription>
          </DialogHeader>
          <ScrollArea className="min-h-0 flex-1 overflow-hidden px-4">
            <Tabs defaultValue="uri" className="min-h-0 pb-4">
            <TabsList>
              <TabsTrigger value="uri">链接任务</TabsTrigger>
              <TabsTrigger value="torrent" disabled>种子任务</TabsTrigger>
            </TabsList>
            <TabsContent value="uri" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="uris">任务链接</Label>
                <Textarea
                  id="uris"
                  className="min-h-28"
                  placeholder="https://example.com/file.zip"
                  value={form.uris}
                  onChange={(event) => setForm({ ...form, uris: event.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                <div className="space-y-2">
                  <Label htmlFor="out">文件名</Label>
                  <Input
                    id="out"
                    placeholder="留空使用远程文件名"
                    value={form.out}
                    onChange={(event) => setForm({ ...form, out: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="split">连接数</Label>
                  <Input
                    id="split"
                    type="number"
                    min={1}
                    max={64}
                    value={form.split}
                    onChange={(event) => setForm({ ...form, split: Number(event.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dir">保存目录</Label>
                <div className="flex gap-2">
                  <Input
                    id="dir"
                    value={form.dir}
                    onChange={(event) => setForm({ ...form, dir: event.target.value })}
                  />
                  <Button variant="outline" onClick={() => void chooseDirectory()}>
                    <Folder />
                    选择
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-downloading"
                  checked={form.showDownloading}
                  onCheckedChange={(checked) => setForm({ ...form, showDownloading: checked === true })}
                />
                <Label htmlFor="show-downloading">添加后跳转到正在下载</Label>
              </div>
              <Button variant="ghost" className="px-0" onClick={() => setAdvancedOpen(!advancedOpen)}>
                <Settings />
                {advancedOpen ? "隐藏高级选项" : "显示高级选项"}
              </Button>
              {advancedOpen ? (
                <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
                  <LabeledTextarea id="user-agent" label="User-Agent" value={form.userAgent} onChange={(value) => setForm({ ...form, userAgent: value })} />
                  <LabeledTextarea id="authorization" label="Authorization" value={form.authorization} onChange={(value) => setForm({ ...form, authorization: value })} />
                  <LabeledTextarea id="referer" label="Referer" value={form.referer} onChange={(value) => setForm({ ...form, referer: value })} />
                  <LabeledTextarea id="cookie" label="Cookie" value={form.cookie} onChange={(value) => setForm({ ...form, cookie: value })} />
                  <div className="space-y-2 md:col-span-2">
                    <Label>代理</Label>
                    <Input
                      placeholder="[http://][USER:PASSWORD@]HOST[:PORT]"
                      value={form.allProxy}
                      onChange={(event) => setForm({ ...form, allProxy: event.target.value })}
                    />
                  </div>
                </div>
              ) : null}
            </TabsContent>
            </Tabs>
          </ScrollArea>
          {addTaskError ? (
            <div className="mx-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {addTaskError}
            </div>
          ) : null}
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background p-4">
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button onClick={() => void submitTask()}>提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PrimaryAside({
  page,
  onNavigate,
  onAddTask,
}: {
  page: Page
  onNavigate: (page: Page) => void
  onAddTask: () => void
}) {
  return (
    <aside className="flex w-[78px] shrink-0 flex-col items-center bg-zinc-950 text-white">
      <div className="mt-9 flex size-9 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
        <Download className="size-5" />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-4">
        <IconNav active={page === "tasks"} label="任务" onClick={() => onNavigate("tasks")} icon={<FileDown />} />
        <IconNav label="新建" onClick={onAddTask} icon={<Plus />} />
      </nav>
      <nav className="mb-6 flex flex-col gap-4">
        <IconNav active={page === "preferences"} label="偏好" onClick={() => onNavigate("preferences")} icon={<Settings />} />
        <IconNav active={page === "about"} label="关于" onClick={() => onNavigate("about")} icon={<Info />} />
      </nav>
    </aside>
  )
}

function IconNav({ active, label, onClick, icon }: { active?: boolean; label: string; onClick: () => void; icon: ReactNode }) {
  return (
    <Button
      aria-label={label}
      title={label}
      variant="ghost"
      size="icon"
      className={`rounded-full text-white hover:bg-white/15 hover:text-white ${active ? "bg-white/20" : ""}`}
      onClick={onClick}
    >
      {icon}
    </Button>
  )
}

function TaskSubnav({ status, onStatusChange }: { status: TaskListStatus; onStatusChange: (status: TaskListStatus) => void }) {
  return (
    <aside className="hidden w-[200px] shrink-0 bg-muted/50 px-4 py-[84px] md:block">
      <div className="space-y-2">
        {(Object.keys(statusLabels) as TaskListStatus[]).map((item) => (
          <Button
            key={item}
            variant={status === item ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onStatusChange(item)}
          >
            {item === "active" ? <Activity /> : item === "waiting" ? <Loader2 /> : <CheckCircle2 />}
            {statusLabels[item]}
          </Button>
        ))}
      </div>
    </aside>
  )
}

function TaskCard({
  task,
  selected,
  onSelectedChange,
  onAction,
}: {
  task: Aria2Task
  selected: boolean
  onSelectedChange: (checked: boolean) => void
  onAction: (task: Aria2Task, action: "pause" | "resume" | "remove") => Promise<void>
}) {
  const progress = getProgress(task)
  const taskPath = task.files?.[0]?.path || task.dir

  return (
    <Card className={`transition-colors ${selected ? "border-primary" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={selected} onCheckedChange={(checked) => onSelectedChange(checked === true)} className="mt-1" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="line-clamp-2 break-all text-sm font-medium leading-6">{getTaskName(task)}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={statusVariant[task.status] ?? "outline"}>{statusText[task.status] ?? task.status}</Badge>
                  <span>{formatBytes(task.completedLength)} / {formatBytes(task.totalLength)}</span>
                  <span>{formatBytes(task.downloadSpeed)}/s</span>
                  <span>{task.connections || "0"} 连接</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {task.status === "active" ? (
                  <Button variant="ghost" size="icon" onClick={() => void onAction(task, "pause")} title="暂停">
                    <Pause />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => void onAction(task, "resume")} title="开始">
                    <Play />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => void window.grabbit.openPath(taskPath)}>
                      <Folder /> 打开位置
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => void onAction(task, "remove")}>
                      <Trash2 /> 移除任务
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="mt-5 space-y-2">
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

function EmptyTasks({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center">
      <div>
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
          <FileDown className="size-8 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-medium">暂无任务</h2>
        <p className="mt-2 text-sm text-muted-foreground">点击新建任务开始下载。</p>
        <Button className="mt-4" onClick={onAddTask}>
          <Plus /> 新建任务
        </Button>
      </div>
    </div>
  )
}

function NoticeBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${notice.tone === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "bg-muted"}`}>
      <div className="flex items-center gap-2">
        {notice.tone === "error" ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
        {notice.message}
      </div>
      <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
        <X />
      </Button>
    </div>
  )
}

function Speedometer({ speed, activeCount }: { speed: number; activeCount: number }) {
  return (
    <div className="fixed bottom-6 right-6 z-20 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Gauge />
        </div>
        <div>
          <div className="text-sm font-semibold">{formatBytes(speed)}/s</div>
          <div className="text-xs text-muted-foreground">{activeCount} 个活动任务</div>
        </div>
      </div>
    </div>
  )
}

function LabeledTextarea({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function PreferencesPage() {
  return (
    <main className="flex flex-1 flex-col bg-muted/30">
      <header className="flex h-[84px] items-center border-b bg-background px-6">
        <h1 className="text-xl font-semibold">偏好设置</h1>
      </header>
      <div className="max-w-3xl space-y-4 p-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="font-medium">下载引擎</h2>
              <p className="text-sm text-muted-foreground">Grabbit 启动内置 aria2c，并通过 JSON-RPC 管理下载任务。</p>
            </div>
            <Separator />
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>默认 RPC 端口：16800</div>
              <div>默认连接数：16</div>
              <div>会话保存：自动</div>
              <div>断点续传：启用</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function AboutPage() {
  return (
    <main className="flex flex-1 flex-col bg-muted/30">
      <header className="flex h-[84px] items-center border-b bg-background px-6">
        <h1 className="text-xl font-semibold">关于 Grabbit</h1>
      </header>
      <div className="max-w-3xl p-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                <Download />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Grabbit</h2>
                <p className="text-sm text-muted-foreground">基于 Motrix 页面结构重做的下载管理器。</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              保留 Motrix 的侧边栏、任务子导航、新建任务弹窗、任务列表和速度浮窗等大体结构，界面使用 shadcn 组件实现。
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default App
