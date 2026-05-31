import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  FileUp,
  Folder,
  Gauge,
  Info,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCw,
  Search,
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  buildAddTaskOptions,
  defaultGrabbitPreferences,
  defaultTaskSchedulerRule,
  parseCurlCommand,
  splitTaskLinks,
  type AddTaskForm,
  type GrabbitPreferences,
  type SchedulerSpeedMode,
  type TaskSchedulerRule,
} from "../shared/grabbit"
import type { Aria2Task, DeleteTaskFilesResult, TaskListStatus, TaskStatus } from "../preload/preload"

type Page = "tasks" | "preferences" | "about"

type Notice = {
  tone: "success" | "error" | "info"
  message: string
}

const initialForm: AddTaskForm = {
  uris: "",
  torrentPath: "",
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

function getTaskUris(task: Aria2Task) {
  return Array.from(
    new Set(
      task.files
        ?.flatMap((file) => file.uris?.map((uri) => uri.uri) ?? [])
        .filter(Boolean) ?? []
    )
  )
}

function getTaskName(task: Aria2Task) {
  const torrentName = task.bittorrent?.info?.name
  if (torrentName) {
    return torrentName
  }

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

function describeDeleteFilesResult(result: DeleteTaskFilesResult | null) {
  if (!result) {
    return ""
  }

  const parts = []
  if (result.deleted.length > 0) {
    parts.push(`已移入回收站 ${result.deleted.length} 个文件`)
  }
  if (result.skipped.length > 0) {
    parts.push(`跳过 ${result.skipped.length} 项`)
  }
  if (result.failed.length > 0) {
    parts.push(`失败 ${result.failed.length} 项`)
  }

  return parts.length > 0 ? `，${parts.join("，")}` : "，没有可删除的本地文件"
}

function mergeDeleteResults(results: Array<DeleteTaskFilesResult | null>) {
  const merged: DeleteTaskFilesResult = {
    deleted: [],
    skipped: [],
    failed: [],
  }

  for (const result of results) {
    if (!result) {
      continue
    }
    merged.deleted.push(...result.deleted)
    merged.skipped.push(...result.skipped)
    merged.failed.push(...result.failed)
  }

  return merged.deleted.length > 0 || merged.skipped.length > 0 || merged.failed.length > 0 ? merged : null
}

export function App() {
  const [page, setPage] = useState<Page>("tasks")
  const [status, setStatus] = useState<TaskListStatus>("active")
  const [tasks, setTasks] = useState<Aria2Task[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [form, setForm] = useState<AddTaskForm>(initialForm)
  const [preferences, setPreferences] = useState<GrabbitPreferences | null>(null)
  const [schedulerRule, setSchedulerRule] = useState<TaskSchedulerRule | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [notice, setNotice] = useState<Notice | null>(null)
  const [addTaskError, setAddTaskError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Aria2Task | null>(null)
  const [deleteBatchTargets, setDeleteBatchTargets] = useState<Aria2Task[]>([])
  const [deleteFiles, setDeleteFiles] = useState(false)
  const [detailTask, setDetailTask] = useState<Aria2Task | null>(null)

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
    void window.grabbit.getPreferences().then((nextPreferences) => {
      setPreferences(nextPreferences)
      setForm((current) => ({ ...current, dir: nextPreferences.downloadDir }))
    })
    void window.grabbit.getScheduler().then(setSchedulerRule)
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

  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return tasks
    }

    return tasks.filter((task) => {
      const haystack = [
        task.gid,
        getTaskName(task),
        task.dir,
        ...(task.files?.flatMap((file) => [file.path, ...(file.uris?.map((uri) => uri.uri) ?? [])]) ?? []),
      ]
        .join("\n")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [searchQuery, tasks])

  const submitTask = async () => {
    const uris = splitTaskLinks(form.uris)

    if (uris.length === 0 && !form.torrentPath) {
      setAddTaskError("请输入至少一个下载链接，或选择一个 .torrent 文件")
      return
    }

    try {
      if (form.torrentPath) {
        await window.grabbit.addTorrent({ torrentPath: form.torrentPath, options: buildAddTaskOptions(form) })
      }
      if (uris.length > 0) {
        await window.grabbit.addUri({ uris, options: buildAddTaskOptions(form) })
      }
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

  const copyText = async (text: string, successMessage: string) => {
    if (!text) {
      setNotice({ tone: "error", message: "没有可复制的内容" })
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setNotice({ tone: "success", message: successMessage })
    } catch {
      setNotice({ tone: "error", message: "复制失败，请检查剪贴板权限" })
    }
  }

  const copyTaskLinks = async (task: Aria2Task) => {
    const links = getTaskUris(task)
    await copyText(links.join("\n"), "任务链接已复制")
  }

  const runTaskAction = async (task: Aria2Task, action: "pause" | "resume" | "remove" | "restart") => {
    try {
      if (action === "pause") {
        await window.grabbit.pauseTask(task.gid)
      } else if (action === "resume") {
        await window.grabbit.resumeTask(task.gid)
      } else if (action === "restart") {
        await window.grabbit.restartTask(task, { dir: task.dir })
        setNotice({ tone: "success", message: "已重新添加任务" })
      } else {
        await confirmRemoveTasks([task])
        return
      }

      await loadTasks()
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "操作失败",
      })
    }
  }

  const confirmRemoveTasks = async (targets: Aria2Task[]) => {
    try {
      const results = []
      for (const task of targets) {
        const result = task.status === "complete" || task.status === "error" || task.status === "removed"
          ? await window.grabbit.removeTaskResult(task, deleteFiles)
          : await window.grabbit.removeTask(task, deleteFiles)
        results.push(result)
      }

      setNotice({
        tone: "success",
        message: `已移除 ${targets.length} 个任务${describeDeleteFilesResult(mergeDeleteResults(results))}`,
      })
      setDeleteTarget(null)
      setDeleteBatchTargets([])
      setDeleteFiles(false)
      setSelected(new Set())
      await loadTasks()
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "移除任务失败",
      })
    }
  }

  const runBatchAction = async (action: "pause" | "resume" | "remove") => {
    const selectedTasks = tasks.filter((task) => selected.has(task.gid))
    if (action === "remove") {
      setDeleteBatchTargets(selectedTasks)
      setDeleteFiles(false)
      return
    }

    for (const task of selectedTasks) {
      await runTaskAction(task, action)
    }
    setSelected(new Set())
  }

  const chooseTorrent = async () => {
    const torrentPath = await window.grabbit.selectTorrent()
    if (torrentPath) {
      setForm((current) => ({ ...current, torrentPath }))
    }
  }

  const chooseDirectory = async () => {
    const directory = await window.grabbit.selectDirectory()
    if (directory) {
      setForm((current) => ({ ...current, dir: directory }))
    }
  }

  const savePreferences = async (nextPreferences: GrabbitPreferences) => {
    try {
      const savedPreferences = await window.grabbit.setPreferences(nextPreferences)
      setPreferences(savedPreferences)
      setForm((current) => ({ ...current, dir: savedPreferences.downloadDir }))
      setNotice({ tone: "success", message: "偏好设置已保存，新任务会使用新的默认目录" })
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "保存偏好设置失败",
      })
    }
  }

  const saveScheduler = async (rule: TaskSchedulerRule) => {
    try {
      const savedRule = await window.grabbit.setScheduler(rule)
      setSchedulerRule(savedRule)
      setNotice({ tone: "success", message: "速度计划已保存，并已应用到 aria2 引擎" })
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "保存速度计划失败",
      })
    }
  }

  const chooseDefaultDirectory = async () => {
    const directory = await window.grabbit.selectDirectory()
    if (directory) {
      const nextPreferences = preferences ?? defaultGrabbitPreferences(directory)
      await savePreferences({ ...nextPreferences, downloadDir: directory })
    }
  }

  const openAddTaskDialog = async () => {
    setAddOpen(true)
    const clipboardText = await navigator.clipboard.readText().catch(() => "")
    const parsedCurl = parseCurlCommand(clipboardText)
    const detectedUris = parsedCurl?.uris ?? splitTaskLinks(clipboardText)

    if (parsedCurl) {
      setForm((current) => ({
        ...current,
        uris: parsedCurl.uris.join("\n"),
        out: parsedCurl.out || current.out,
        userAgent: parsedCurl.userAgent || current.userAgent,
        authorization: parsedCurl.authorization || current.authorization,
        referer: parsedCurl.referer || current.referer,
        cookie: parsedCurl.cookie || current.cookie,
      }))
      return
    }

    if (detectedUris.length > 0) {
      setForm((current) => ({
        ...current,
        uris: current.uris || detectedUris.join("\n"),
      }))
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <PrimaryAside page={page} onNavigate={setPage} onAddTask={() => void openAddTaskDialog()} />

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
                  {visibleTasks.length} / {tasks.length} 个任务 · 当前速度 {formatBytes(totalSpeed)}/s
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
                {status === "stopped" ? (
                  <Button variant="outline" size="sm" onClick={() => void window.grabbit.purgeResults().then(loadTasks)}>
                    <Trash2 />
                    清空记录
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => void openAddTaskDialog()}>
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

            <div className="flex items-center gap-2 border-b px-6 py-3">
              <Search className="size-4 text-muted-foreground" />
              <Input
                aria-label="搜索任务"
                placeholder="搜索任务名、GID、保存目录或原始链接"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery ? (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>清除</Button>
              ) : null}
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 p-4 pb-24">
                {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}
                {loading && tasks.length === 0 ? (
                  <div className="flex h-72 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 animate-spin" /> 正在读取 aria2 任务...
                  </div>
                ) : visibleTasks.length > 0 ? (
                  visibleTasks.map((task) => (
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
                      onShowDetails={setDetailTask}
                      onCopyLinks={copyTaskLinks}
                      onAction={(task, action) => {
                        if (action === "remove") {
                          setDeleteTarget(task)
                          setDeleteFiles(false)
                          return Promise.resolve()
                        }
                        return runTaskAction(task, action)
                      }}
                    />
                  ))
                ) : (
                  <EmptyTasks onAddTask={() => void openAddTaskDialog()} />
                )}
              </div>
            </ScrollArea>
          </section>
        </main>
      ) : null}

      {page === "preferences" ? (
        <PreferencesPage
          preferences={preferences}
          schedulerRule={schedulerRule}
          onChange={setPreferences}
          onSchedulerChange={setSchedulerRule}
          onSave={savePreferences}
          onSaveScheduler={saveScheduler}
          onChooseDirectory={chooseDefaultDirectory}
        />
      ) : null}
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
              <TabsTrigger value="torrent">种子任务</TabsTrigger>
            </TabsList>
            <TabsContent value="uri" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="uris">任务链接</Label>
                <Textarea
                  id="uris"
                  className="min-h-28"
                  placeholder="https://example.com/file.zip\nmagnet:?xt=urn:btih:...\n或粘贴 curl 命令自动解析"
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
            <TabsContent value="torrent" className="space-y-4 pt-4">
              <div className="rounded-lg border border-dashed p-4">
                <div className="flex items-start gap-3">
                  <FileUp className="mt-1 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <Label>种子文件</Label>
                    <p className="mt-1 text-sm text-muted-foreground">选择本地 .torrent 文件后，Grabbit 会通过 aria2.addTorrent 添加任务。</p>
                    <div className="mt-3 flex gap-2">
                      <Input value={form.torrentPath} placeholder="尚未选择 .torrent 文件" readOnly />
                      <Button variant="outline" onClick={() => void chooseTorrent()}>选择文件</Button>
                    </div>
                  </div>
                </div>
              </div>
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

      <Dialog open={detailTask !== null} onOpenChange={(open) => {
        if (!open) {
          setDetailTask(null)
        }
      }}>
        <DialogContent className="flex h-[86vh] w-[min(760px,calc(100vw-2rem))] max-w-none grid-rows-none flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 p-4 pb-0">
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>
              {detailTask ? getTaskName(detailTask) : "查看任务的下载信息、原始链接和文件列表。"}
            </DialogDescription>
          </DialogHeader>
          {detailTask ? (
            <TaskDetails
              task={detailTask}
              onCopy={(text, message) => void copyText(text, message)}
              onOpenPath={(targetPath) => void window.grabbit.openPath(targetPath)}
            />
          ) : null}
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background p-4">
            <Button variant="outline" onClick={() => setDetailTask(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null || deleteBatchTargets.length > 0} onOpenChange={(open) => {
        if (!open) {
          setDeleteTarget(null)
          setDeleteBatchTargets([])
          setDeleteFiles(false)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认移除任务？</DialogTitle>
            <DialogDescription>
              {deleteBatchTargets.length > 0
                ? `将从列表中移除选中的 ${deleteBatchTargets.length} 个任务。`
                : deleteTarget
                  ? `将从列表中移除“${getTaskName(deleteTarget)}”。`
                  : "将从列表中移除该任务。"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start space-x-2 rounded-lg border p-3">
            <Checkbox id="delete-files" checked={deleteFiles} onCheckedChange={(checked) => setDeleteFiles(checked === true)} />
            <div className="space-y-1">
              <Label htmlFor="delete-files" className="text-sm">同时删除本地文件</Label>
              <p className="text-xs text-muted-foreground">文件会被移动到系统回收站。为避免误删，仅处理 aria2 返回且位于任务保存目录内的文件，目录会跳过。</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteTarget(null)
              setDeleteBatchTargets([])
              setDeleteFiles(false)
            }}>取消</Button>
            <Button variant="destructive" onClick={() => {
              const targets = deleteBatchTargets.length > 0 ? deleteBatchTargets : deleteTarget ? [deleteTarget] : []
              if (targets.length > 0) {
                void confirmRemoveTasks(targets)
              }
            }}>移除</Button>
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
  onShowDetails,
  onCopyLinks,
  onAction,
}: {
  task: Aria2Task
  selected: boolean
  onSelectedChange: (checked: boolean) => void
  onShowDetails: (task: Aria2Task) => void
  onCopyLinks: (task: Aria2Task) => Promise<void>
  onAction: (task: Aria2Task, action: "pause" | "resume" | "remove" | "restart") => Promise<void>
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
                    <DropdownMenuItem onClick={() => onShowDetails(task)}>
                      <FileText /> 查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void onCopyLinks(task)}>
                      <Clipboard /> 复制链接
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void window.grabbit.openPath(taskPath)}>
                      <Folder /> 打开位置
                    </DropdownMenuItem>
                    {(task.status === "complete" || task.status === "error" || task.status === "removed") ? (
                      <DropdownMenuItem onClick={() => void onAction(task, "restart")}>
                        <RotateCw /> 重新下载
                      </DropdownMenuItem>
                    ) : null}
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

function TaskDetails({
  task,
  onCopy,
  onOpenPath,
}: {
  task: Aria2Task
  onCopy: (text: string, message: string) => void
  onOpenPath: (targetPath: string) => void
}) {
  const taskUris = getTaskUris(task)
  const progress = getProgress(task)
  const taskPath = task.files?.[0]?.path || task.dir

  return (
    <ScrollArea className="min-h-0 flex-1 px-4 py-4">
      <div className="space-y-4 pb-2">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <DetailItem label="GID" value={task.gid} />
          <DetailItem label="状态" value={statusText[task.status] ?? task.status} />
          <DetailItem label="保存目录" value={task.dir || "-"} />
          <DetailItem label="连接数" value={task.connections || "0"} />
          <DetailItem label="已完成" value={formatBytes(task.completedLength)} />
          <DetailItem label="总大小" value={formatBytes(task.totalLength)} />
          <DetailItem label="下载速度" value={`${formatBytes(task.downloadSpeed)}/s`} />
          <DetailItem label="上传速度" value={`${formatBytes(task.uploadSpeed)}/s`} />
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium">进度</h3>
              <p className="text-xs text-muted-foreground">{formatBytes(task.completedLength)} / {formatBytes(task.totalLength)}</p>
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">原始链接</h3>
            <Button variant="outline" size="sm" onClick={() => onCopy(taskUris.join("\n"), "任务链接已复制")} disabled={taskUris.length === 0}>
              <Clipboard /> 复制全部
            </Button>
          </div>
          {taskUris.length > 0 ? (
            <div className="space-y-2">
              {taskUris.map((uri) => (
                <div key={uri} className="flex items-start justify-between gap-2 rounded-md bg-muted/40 p-2 text-xs">
                  <code className="min-w-0 break-all">{uri}</code>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => onCopy(uri, "链接已复制")}>
                    <Clipboard />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">aria2 没有返回原始链接；种子任务或部分历史记录可能只包含文件信息。</p>
          )}
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">文件列表</h3>
            <Button variant="outline" size="sm" onClick={() => onOpenPath(taskPath)} disabled={!taskPath}>
              <ExternalLink /> 打开位置
            </Button>
          </div>
          {task.files?.length ? (
            <div className="divide-y rounded-md border">
              {task.files.map((file, index) => {
                const fileProgress = toNumber(file.length) > 0
                  ? Math.min(100, Math.round((toNumber(file.completedLength) / toNumber(file.length)) * 100))
                  : 0
                return (
                  <div key={`${file.path}-${index}`} className="space-y-2 p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="break-all font-medium">{file.path || `文件 ${index + 1}`}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatBytes(file.completedLength)} / {formatBytes(file.length)} · {file.selected === "true" ? "已选择" : "未选择"}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => onCopy(file.path, "文件路径已复制")}>
                        <Clipboard />
                      </Button>
                    </div>
                    <Progress value={fileProgress} />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无文件信息。</p>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-all text-sm font-medium">{value || "-"}</div>
    </div>
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

function PreferencesPage({
  preferences,
  schedulerRule,
  onChange,
  onSchedulerChange,
  onSave,
  onSaveScheduler,
  onChooseDirectory,
}: {
  preferences: GrabbitPreferences | null
  schedulerRule: TaskSchedulerRule | null
  onChange: (preferences: GrabbitPreferences) => void
  onSchedulerChange: (rule: TaskSchedulerRule) => void
  onSave: (preferences: GrabbitPreferences) => Promise<void>
  onSaveScheduler: (rule: TaskSchedulerRule) => Promise<void>
  onChooseDirectory: () => Promise<void>
}) {
  const currentPreferences = preferences ?? defaultGrabbitPreferences("")
  const currentSchedulerRule = schedulerRule ?? defaultTaskSchedulerRule()

  return (
    <main className="flex flex-1 flex-col bg-muted/30">
      <header className="flex h-[84px] items-center border-b bg-background px-6">
        <h1 className="text-xl font-semibold">偏好设置</h1>
      </header>
      <div className="max-w-3xl space-y-4 overflow-auto p-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="font-medium">下载引擎</h2>
              <p className="text-sm text-muted-foreground">Grabbit 启动内置 aria2c，并通过 JSON-RPC 管理下载任务。</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="default-download-dir">默认保存目录</Label>
              <div className="flex gap-2">
                <Input
                  id="default-download-dir"
                  placeholder="默认下载目录"
                  value={currentPreferences.downloadDir}
                  onChange={(event) => onChange({ ...currentPreferences, downloadDir: event.target.value })}
                />
                <Button variant="outline" onClick={() => void onChooseDirectory()}>
                  <Folder />
                  选择
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <NumberPreference
                id="max-concurrent-downloads"
                label="同时下载任务数"
                min={1}
                max={64}
                value={currentPreferences.maxConcurrentDownloads}
                onChange={(value) => onChange({ ...currentPreferences, maxConcurrentDownloads: value })}
              />
              <NumberPreference
                id="max-connection-per-server"
                label="单服务器连接数"
                min={1}
                max={64}
                value={currentPreferences.maxConnectionPerServer}
                onChange={(value) => onChange({ ...currentPreferences, maxConnectionPerServer: value })}
              />
              <NumberPreference
                id="default-split"
                label="默认分片数"
                min={1}
                max={64}
                value={currentPreferences.split}
                onChange={(value) => onChange({ ...currentPreferences, split: value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextPreference
                id="download-limit"
                label="全局下载限速"
                placeholder="0 表示不限速，如 2M / 512K"
                value={currentPreferences.maxOverallDownloadLimit}
                onChange={(value) => onChange({ ...currentPreferences, maxOverallDownloadLimit: value })}
              />
              <TextPreference
                id="upload-limit"
                label="全局上传限速"
                placeholder="0 表示不限速，如 1M / 256K"
                value={currentPreferences.maxOverallUploadLimit}
                onChange={(value) => onChange({ ...currentPreferences, maxOverallUploadLimit: value })}
              />
            </div>
            <TextPreference
              id="global-proxy"
              label="全局代理"
              placeholder="[http://][USER:PASSWORD@]HOST[:PORT]"
              value={currentPreferences.allProxy}
              onChange={(value) => onChange({ ...currentPreferences, allProxy: value })}
            />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="continue-downloads">断点续传</Label>
                <p className="text-xs text-muted-foreground">对应 aria2 continue 选项，关闭后新任务不会自动续传。</p>
              </div>
              <Switch
                id="continue-downloads"
                checked={currentPreferences.continueDownloads}
                onCheckedChange={(checked) => onChange({ ...currentPreferences, continueDownloads: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                保存后会持久化设置，并对正在运行的 aria2 引擎应用全局选项。
              </p>
              <Button onClick={() => void onSave(currentPreferences)} disabled={!currentPreferences.downloadDir.trim()}>
                保存
              </Button>
            </div>
            <Separator />
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>RPC 端口：16800</div>
              <div>同时任务：{currentPreferences.maxConcurrentDownloads}</div>
              <div>单服务器连接：{currentPreferences.maxConnectionPerServer}</div>
              <div>断点续传：{currentPreferences.continueDownloads ? "启用" : "关闭"}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">速度计划</h2>
                <p className="text-sm text-muted-foreground">按星期和时间段自动切换全局下载/上传限速，类似 Motrix 的任务计划。</p>
              </div>
              <Switch
                id="scheduler-enabled"
                checked={currentSchedulerRule.enabled}
                onCheckedChange={(checked) => onSchedulerChange({ ...currentSchedulerRule, enabled: checked })}
              />
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <TextPreference
                id="scheduler-start"
                label="开始时间"
                placeholder="HH:mm"
                value={currentSchedulerRule.startTime}
                onChange={(value) => onSchedulerChange({ ...currentSchedulerRule, startTime: value })}
              />
              <TextPreference
                id="scheduler-end"
                label="结束时间"
                placeholder="HH:mm"
                value={currentSchedulerRule.endTime}
                onChange={(value) => onSchedulerChange({ ...currentSchedulerRule, endTime: value })}
              />
            </div>
            <div className="space-y-2">
              <Label>重复</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={currentSchedulerRule.repeatDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSchedulerChange(toggleSchedulerDay(currentSchedulerRule, day.value))}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>计划期间速度</Label>
              <div className="flex flex-wrap gap-2">
                {speedModes.map((mode) => (
                  <Button
                    key={mode.value}
                    type="button"
                    variant={currentSchedulerRule.speedMode === mode.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSchedulerChange({ ...currentSchedulerRule, speedMode: mode.value })}
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
            </div>
            {currentSchedulerRule.speedMode === "manual" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <TextPreference
                  id="scheduler-download-limit"
                  label="计划下载限速"
                  placeholder="如 300K / 2M / 0"
                  value={currentSchedulerRule.downloadLimit}
                  onChange={(value) => onSchedulerChange({ ...currentSchedulerRule, downloadLimit: value })}
                />
                <TextPreference
                  id="scheduler-upload-limit"
                  label="计划上传限速"
                  placeholder="如 100K / 1M / 0"
                  value={currentSchedulerRule.uploadLimit}
                  onChange={(value) => onSchedulerChange({ ...currentSchedulerRule, uploadLimit: value })}
                />
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                计划生效时会把全局上传/下载限速切换为 0（不限速）；计划外恢复偏好设置里的全局限速。
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Grabbit 每分钟检查一次计划；保存后会立即根据当前时间应用。
              </p>
              <Button onClick={() => void onSaveScheduler(currentSchedulerRule)}>
                保存速度计划
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

const weekDays = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 0, label: "周日" },
]

const speedModes: Array<{ value: SchedulerSpeedMode; label: string }> = [
  { value: "manual", label: "使用指定限速" },
  { value: "unlimited", label: "不限速" },
]

function toggleSchedulerDay(rule: TaskSchedulerRule, day: number) {
  const nextDays = rule.repeatDays.includes(day)
    ? rule.repeatDays.filter((item) => item !== day)
    : [...rule.repeatDays, day]
  return {
    ...rule,
    repeatDays: nextDays.length > 0 ? nextDays : rule.repeatDays,
  }
}

function NumberPreference({
  id,
  label,
  min,
  max,
  value,
  onChange,
}: {
  id: string
  label: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))}
      />
    </div>
  )
}

function TextPreference({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
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
