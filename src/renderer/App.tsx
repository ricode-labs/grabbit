import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react"

import {
  EmptyTasks,
  MetricChip,
  NoticeBanner,
  PrimaryAside,
  Speedometer,
  TaskSubnav,
} from "@/components/app-shell"
import { AboutPage } from "@/components/about-page"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskDetails } from "@/components/tasks/task-details"
import type { Notice, Page } from "./lib/app-types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  defaultGrabbitPreferences,
  parseCurlCommand,
  splitTaskLinks,
  type AddTaskForm,
  buildInitialAddTaskForm,
} from "../shared/grabbit"
import type { Options } from "../shared/aria2"

import {
  type Aria2Task,
  formatBytes,
  getTaskName,
  getTaskUris,
  statusLabels,
  statusMeta,
  type TaskListStatus,
  toNumber,
} from "./lib/task-display"

const fallbackInitialForm = buildInitialAddTaskForm(
  defaultGrabbitPreferences("")
)

function buildAria2AddTaskOptions(form: AddTaskForm): Options {
  return Object.fromEntries(
    Object.entries({
      dir: form.dir,
      "select-file": form.selectedTorrentFiles,
    }).filter(([, value]) => value !== "")
  )
}

export function App() {
  const [page, setPage] = useState<Page>("tasks")
  const [status, setStatus] = useState<TaskListStatus>("active")
  const [tasks, setTasks] = useState<Aria2Task[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<AddTaskForm>(fallbackInitialForm)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [notice, setNotice] = useState<Notice | null>(null)
  const [addTaskError, setAddTaskError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Aria2Task | null>(null)
  const [deleteBatchTargets, setDeleteBatchTargets] = useState<Aria2Task[]>([])
  const [detailTask, setDetailTask] = useState<Aria2Task | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const nextTasks =
        status === "active"
          ? await window.aria2.tellActive()
          : status === "waiting"
            ? await window.aria2.tellWaiting({ offset: 0, num: 100 })
            : await window.aria2.tellStopped({ offset: 0, num: 100 })
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
        ...(task.files?.flatMap((file) => [
          file.path,
          ...(file.uris?.map((uri) => uri.uri) ?? []),
        ]) ?? []),
      ]
        .join("\n")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [searchQuery, tasks])

  const submitTask = async () => {
    const uris = splitTaskLinks(form.uris)
    const taskOptions = buildAria2AddTaskOptions(form)

    if (uris.length === 0 && !form.torrentPath) {
      setAddTaskError("请输入至少一个下载链接，或选择一个 .torrent 文件")
      return
    }

    try {
      if (form.torrentPath) {
        await window.aria2.addTorrent({
          torrentPath: form.torrentPath,
          options: taskOptions,
        })
      }
      if (uris.length > 0) {
        await window.aria2.addUri({ uris, options: taskOptions })
      }
      setAddTaskError(null)
      setNotice({ tone: "success", message: "任务已添加" })
      setAddOpen(false)
      const nextForm = buildInitialAddTaskForm(
        defaultGrabbitPreferences(form.dir)
      )
      setForm({ ...nextForm, dir: form.dir })
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

  const openLocalPath = async (targetPath: string) => {
    if (!targetPath) {
      setNotice({ tone: "error", message: "没有可打开的路径" })
      return
    }

    setNotice({ tone: "error", message: "打开本地路径功能暂不可用" })
  }

  const runTaskAction = async (
    task: Aria2Task,
    action: "pause" | "resume" | "remove" | "restart"
  ) => {
    try {
      if (action === "pause") {
        await window.aria2.pause({ gid: task.gid })
      } else if (action === "resume") {
        await window.aria2.unpause({ gid: task.gid })
      } else if (action === "restart") {
        const uris = getTaskUris(task)
        if (uris.length === 0) {
          throw new Error("这个任务没有可用于重新下载的原始链接")
        }
        await window.aria2.addUri({ uris, options: { dir: task.dir } })
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
      for (const task of targets) {
        if (
          task.status === "complete" ||
          task.status === "error" ||
          task.status === "removed"
        ) {
          await window.aria2.removeDownloadResult({ gid: task.gid })
        } else {
          await window.aria2.remove({ gid: task.gid })
        }
      }

      setNotice({
        tone: "success",
        message: `已移除 ${targets.length} 个任务`,
      })
      setDeleteTarget(null)
      setDeleteBatchTargets([])
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
      return
    }

    for (const task of selectedTasks) {
      await runTaskAction(task, action)
    }
    setSelected(new Set())
  }

  const clearTorrent = () => {
    setForm((current) => ({
      ...current,
      torrentPath: "",
      selectedTorrentFiles: "",
    }))
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
    <div className="app-shell-bg relative flex h-screen overflow-hidden bg-background text-foreground">
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-20" />
      <PrimaryAside
        page={page}
        onNavigate={setPage}
        onAddTask={() => void openAddTaskDialog()}
      />

      {page === "tasks" ? (
        <main className="relative z-10 flex min-w-0 flex-1 gap-0">
          <TaskSubnav
            status={status}
            onStatusChange={(nextStatus) => {
              setSelected(new Set())
              setStatus(nextStatus)
            }}
          />
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
            <header className="border-b bg-background px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
                    <Sparkles className="size-3.5 text-primary" /> Grabbit
                  </div>
                  <h1 className="text-lg font-semibold">
                    {statusLabels[status]}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {statusMeta[status].caption}
                  </p>
                </div>
                <div className="hidden items-center gap-3 xl:flex">
                  <MetricChip
                    label="可见任务"
                    value={`${visibleTasks.length}/${tasks.length}`}
                  />
                  <MetricChip
                    label="实时速度"
                    value={`${formatBytes(totalSpeed)}/s`}
                    accent
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadTasks()}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RotateCw />
                  )}
                  刷新
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void window.aria2.pauseAll().then(loadTasks)}
                >
                  <Pause />
                  全部暂停
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void window.aria2.unpauseAll().then(loadTasks)}
                >
                  <Play />
                  全部开始
                </Button>
                {status === "stopped" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void window.aria2.purgeDownloadResult().then(loadTasks)
                    }
                  >
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
              <div className="mx-4 mt-4 flex items-center justify-between rounded-md border bg-primary/10 px-4 py-3 text-sm text-primary shadow-sm">
                <span>已选择 {selected.size} 个任务</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void runBatchAction("pause")}
                  >
                    暂停
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void runBatchAction("resume")}
                  >
                    开始
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void runBatchAction("remove")}
                  >
                    移除
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border bg-background px-4 py-2 shadow-sm">
              <Search className="size-4 text-muted-foreground" />
              <Input
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                aria-label="搜索任务"
                placeholder="搜索任务名、GID、保存目录或原始链接"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  清除
                </Button>
              ) : null}
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 p-4 pb-16">
                {notice ? (
                  <NoticeBanner
                    notice={notice}
                    onClose={() => setNotice(null)}
                  />
                ) : null}
                {loading && tasks.length === 0 ? (
                  <div className="flex h-72 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 animate-spin" /> 正在读取 aria2
                    任务...
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
                      onOpenPath={openLocalPath}
                      onAction={(task, action) => {
                        if (action === "remove") {
                          setDeleteTarget(task)
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
        <main className="relative z-10 flex min-w-0 flex-1 flex-col bg-background p-6">
          <NoticeBanner
            notice={{ tone: "error", message: "偏好设置功能暂不可用" }}
            onClose={() => setPage("tasks")}
          />
        </main>
      ) : null}
      {page === "about" ? <AboutPage /> : null}

      <Speedometer
        speed={totalSpeed}
        activeCount={tasks.filter((task) => task.status === "active").length}
      />

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) {
            setAddTaskError(null)
          }
        }}
      >
        <DialogContent className="flex h-[88vh] w-[min(720px,calc(100vw-2rem))] max-w-none grid-rows-none flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 p-4 pb-0">
            <DialogTitle>新建下载任务</DialogTitle>
            <DialogDescription>
              支持 HTTP、HTTPS、FTP、磁力链接。每行一个链接。
            </DialogDescription>
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
                    onChange={(event) =>
                      setForm({ ...form, uris: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dir">保存目录</Label>
                  <Input
                    id="dir"
                    value={form.dir}
                    onChange={(event) =>
                      setForm({ ...form, dir: event.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-downloading"
                    checked={form.showDownloading}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, showDownloading: checked === true })
                    }
                  />
                  <Label htmlFor="show-downloading">添加后跳转到正在下载</Label>
                </div>
              </TabsContent>
              <TabsContent value="torrent" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="torrent-path">种子文件路径</Label>
                  <div className="flex gap-2">
                    <Input
                      id="torrent-path"
                      placeholder="/path/to/file.torrent"
                      value={form.torrentPath}
                      onChange={(event) =>
                        setForm({ ...form, torrentPath: event.target.value })
                      }
                    />
                    <Button variant="outline" onClick={clearTorrent}>
                      清除
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="torrent-dir">保存目录</Label>
                  <Input
                    id="torrent-dir"
                    value={form.dir}
                    onChange={(event) =>
                      setForm({ ...form, dir: event.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="torrent-show-downloading"
                    checked={form.showDownloading}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, showDownloading: checked === true })
                    }
                  />
                  <Label htmlFor="torrent-show-downloading">
                    添加后跳转到正在下载
                  </Label>
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
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void submitTask()}>提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailTask(null)
          }
        }}
      >
        <DialogContent className="flex h-[86vh] w-[min(760px,calc(100vw-2rem))] max-w-none grid-rows-none flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 p-4 pb-0">
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>
              {detailTask
                ? getTaskName(detailTask)
                : "查看任务的下载信息、原始链接和文件列表。"}
            </DialogDescription>
          </DialogHeader>
          {detailTask ? (
            <TaskDetails
              task={detailTask}
              onCopy={(text, message) => void copyText(text, message)}
              onOpenPath={(targetPath) => {
                void openLocalPath(targetPath)
              }}
            />
          ) : null}
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background p-4">
            <Button variant="outline" onClick={() => setDetailTask(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null || deleteBatchTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setDeleteBatchTargets([])
          }
        }}
      >
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null)
                setDeleteBatchTargets([])
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const targets =
                  deleteBatchTargets.length > 0
                    ? deleteBatchTargets
                    : deleteTarget
                      ? [deleteTarget]
                      : []
                if (targets.length > 0) {
                  void confirmRemoveTasks(targets)
                }
              }}
            >
              移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
