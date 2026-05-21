import { useState } from "react"

import {
  Activity,
  Archive,
  ArrowDown,
  ArrowUp,
  Ban,
  Bell,
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  FilePlus2,
  FolderOpen,
  HardDriveDownload,
  HelpCircle,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Tv2,
  Wifi,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type TaskStatus = "active" | "waiting" | "paused" | "complete"

type Task = {
  id: string
  name: string
  url: string
  status: TaskStatus
  progress: number
  speed: string
  size: string
  eta: string
  directory: string
  tags: string[]
}

const tasks: Task[] = [
  {
    id: "task-001",
    name: "Ubuntu-24.04-desktop-amd64.iso",
    url: "https://releases.ubuntu.com/24.04/ubuntu-24.04-desktop-amd64.iso",
    status: "active",
    progress: 72,
    speed: "18.7 MB/s",
    size: "5.6 GB",
    eta: "12m",
    directory: "/Downloads/Linux",
    tags: ["ISO", "Linux"],
  },
  {
    id: "task-003",
    name: "Movie.sample.mkv",
    url: "https://example.com/movie.sample.mkv",
    status: "paused",
    progress: 48,
    speed: "0 B/s",
    size: "2.1 GB",
    eta: "Paused",
    directory: "/Downloads/Media",
    tags: ["Video"],
  },
  {
    id: "task-004",
    name: "Design-assets.tar.gz",
    url: "https://example.com/design-assets.tar.gz",
    status: "complete",
    progress: 100,
    speed: "0 B/s",
    size: "780 MB",
    eta: "Done",
    directory: "/Downloads/Assets",
    tags: ["Archive"],
  },
]

const queueStats = [
  { label: "Active", value: "1", icon: Download },
  { label: "Waiting", value: "1", icon: Clock3 },
  { label: "Paused", value: "1", icon: Pause },
  { label: "Complete", value: "1", icon: CheckCircle2 },
]

const navItems = [
  { label: "Tasks", icon: Archive, active: true },
  { label: "Add URL", icon: FilePlus2 },
  { label: "Preferences", icon: Settings2 },
  { label: "Network", icon: Wifi },
  { label: "Security", icon: ShieldCheck },
  { label: "About", icon: HelpCircle },
]

const statusMeta: Record<TaskStatus, { label: string; tone: string }> = {
  active: { label: "Active", tone: "bg-emerald-500/10 text-emerald-600" },
  waiting: { label: "Waiting", tone: "bg-amber-500/10 text-amber-600" },
  paused: { label: "Paused", tone: "bg-slate-500/10 text-slate-600" },
  complete: { label: "Complete", tone: "bg-blue-500/10 text-blue-600" },
}

function App() {
  const [addTaskOpen, setAddTaskOpen] = useState(false)

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <div className="flex min-h-svh w-full bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--background)))] text-foreground">
        <Sidebar className="border-r border-border/60 bg-sidebar/70 backdrop-blur-xl">
          <SidebarContent className="gap-6 p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <HardDriveDownload className="size-5" />
              </div>
              <div>
                <div className="font-heading text-sm font-semibold">grabbit</div>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        isActive={item.active}
                        className="justify-start gap-3"
                        onClick={() => {
                          if (item.label === "Add URL") {
                            setAddTaskOpen(true)
                          }
                        }}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-3">
                {queueStats.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-4 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl">
            <SidebarTrigger className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-heading text-lg font-semibold">Task Center</div>
              <p className="truncate text-sm text-muted-foreground">
                Manage URI, torrent, and metalink downloads in one place.
              </p>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="relative w-72">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search tasks, folders, URLs..." />
              </div>
              <Tooltip>
                <TooltipTrigger render={<Button variant="outline" size="icon" />}>
                  <Bell className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
              <Button onClick={() => setAddTaskOpen(true)}>
                <Plus className="size-4" />
                Add Task
              </Button>
            </div>
          </header>

          <main className="grid flex-1 gap-4 p-4 xl:grid-cols-[1.6fr_0.9fr]">
            <section className="flex min-w-0 flex-col gap-4">
              <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">Downloads</CardTitle>
                      <CardDescription>
                        Active queue, task actions, and status tabs.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="size-4" />
                        Resume all
                      </Button>
                      <Button variant="outline" size="sm">
                        <Pause className="size-4" />
                        Pause all
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="size-4" />
                        Clear finished
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="active" className="gap-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="waiting">Waiting</TabsTrigger>
                      <TabsTrigger value="paused">Paused</TabsTrigger>
                      <TabsTrigger value="complete">Complete</TabsTrigger>
                    </TabsList>

                    {(["active", "waiting", "paused", "complete"] as const).map(
                      (value) => (
                        <TabsContent key={value} value={value} className="m-0">
                          <div className="space-y-3">
                            {tasks
                              .filter((task) => task.status === value)
                              .map((task) => (
                                <Card
                                  key={task.id}
                                  className="border-border/60 bg-background/90"
                                >
                                  <CardContent className="space-y-4 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h3 className="truncate font-medium">
                                            {task.name}
                                          </h3>
                                          <Badge variant="secondary" className={statusMeta[task.status].tone}>
                                            {statusMeta[task.status].label}
                                          </Badge>
                                        </div>
                                        <p className="truncate text-sm text-muted-foreground">
                                          {task.url}
                                        </p>
                                      </div>
                                      <DropdownActionButton />
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-4">
                                      <TaskMetric label="Progress" value={`${task.progress}%`} />
                                      <TaskMetric label="Speed" value={task.speed} />
                                      <TaskMetric label="Size" value={task.size} />
                                      <TaskMetric label="ETA" value={task.eta} />
                                    </div>

                                    <Progress value={task.progress} className="h-2" />

                                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {task.tags.map((tag) => (
                                          <Badge key={tag} variant="outline">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                          <FolderOpen className="size-4" />
                                          {task.directory}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <Button variant="outline" size="sm">
                                        <Play className="size-4" />
                                        Start
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Pause className="size-4" />
                                        Pause
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <FolderOpen className="size-4" />
                                        Reveal
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Trash2 className="size-4" />
                                        Remove
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </TabsContent>
                      )
                    )}
                  </Tabs>
                </CardHeader>
              </Card>

              <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base">Add Task</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <Textarea
                      className="min-h-32 resize-none"
                      placeholder="Paste download URL, magnet link, or torrent metadata..."
                      defaultValue="https://example.com/file.zip"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button>
                        <Plus className="size-4" />
                        Confirm Add
                      </Button>
                      <Button variant="outline">
                        <HardDriveDownload className="size-4" />
                        Select Torrent
                      </Button>
                      <Button variant="outline">
                        <FolderOpen className="size-4" />
                        Choose Folder
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Download Settings</span>
                      <Badge variant="secondary">Basic</Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Category</label>
                      <Select defaultValue="general">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="archive">Archive</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SettingChip label="Max connections" value="16" />
                      <SettingChip label="Split count" value="8" />
                      <SettingChip label="Referer" value="auto" />
                      <SettingChip label="Proxy" value="disabled" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <aside className="flex min-w-0 flex-col gap-4">
              <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base">Global Activity</CardTitle>
                  <CardDescription>Live queue health and summary.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricTile icon={ArrowDown} label="Download" value="18.7 MB/s" />
                    <MetricTile icon={ArrowUp} label="Upload" value="2.3 MB/s" />
                    <MetricTile icon={CircleDot} label="Peers" value="124" />
                    <MetricTile icon={Ban} label="Errors" value="0" />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall completion</span>
                      <span className="font-medium">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tv2 className="size-4" />
                      Tray and OS integration
                    </div>
                    <Badge variant="outline">Ready</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base">Preferences Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Download path</span>
                      <span className="text-muted-foreground">/Downloads</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Theme</span>
                      <span className="text-muted-foreground">System</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Language</span>
                      <span className="text-muted-foreground">中文</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Badge variant="secondary">Basic</Badge>
                    <Badge variant="secondary">Advanced</Badge>
                    <Badge variant="secondary">Lab</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Task Detail</CardTitle>
                    <Badge variant="outline">Selected</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <Avatar className="size-10">
                      <AvatarFallback>UB</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-medium">Ubuntu ISO</div>
                      <div className="truncate text-sm text-muted-foreground">
                        General · Active · 72% complete
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <DetailRow label="Pieces" value="904 / 1250" />
                    <DetailRow label="Seeders" value="58" />
                    <DetailRow label="Trackers" value="12" />
                    <DetailRow label="ETA" value="12m" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Activity className="size-4" />
                      Inspect
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MoreHorizontal className="size-4" />
                      More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </main>
        </SidebarInset>
      </div>

      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogDescription>
              The core screens are now laid out with the current project&apos;s
              React + shadcn stack.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">What is wired</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Sidebar, task list, add-task form, preferences snapshot, and task
                detail panels.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Next step</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Replace the mock task data with aria2-backed state and bridge the
                Electron main process.
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
              Dismiss
            </Button>
            <Button>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function TaskMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ArrowDown
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}

function SettingChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}

function DropdownActionButton() {
  return (
    <Button variant="ghost" size="icon-sm" className="shrink-0">
      <MoreHorizontal className="size-4" />
    </Button>
  )
}

export default App
