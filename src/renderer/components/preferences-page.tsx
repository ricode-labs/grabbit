import { Folder, SunMoon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { LabeledTextarea } from "@/components/form-fields"
import {
  defaultGrabbitPreferences,
  defaultTaskSchedulerRule,
  userAgentTemplates,
  type EnginePathInfo,
  type GrabbitPreferences,
  type SchedulerSpeedMode,
  type TaskSchedulerRule,
} from "../../shared/grabbit"

export function PreferencesPage({
  preferences,
  schedulerRule,
  enginePaths,
  onChange,
  onSchedulerChange,
  onSave,
  onSaveScheduler,
  onChooseDirectory,
  onOpenPath,
}: {
  preferences: GrabbitPreferences | null
  schedulerRule: TaskSchedulerRule | null
  enginePaths: EnginePathInfo[]
  onChange: (preferences: GrabbitPreferences) => void
  onSchedulerChange: (rule: TaskSchedulerRule) => void
  onSave: (preferences: GrabbitPreferences) => Promise<void>
  onSaveScheduler: (rule: TaskSchedulerRule) => Promise<void>
  onChooseDirectory: () => Promise<void>
  onOpenPath: (targetPath: string) => Promise<void>
}) {
  const currentPreferences = preferences ?? defaultGrabbitPreferences("")
  const currentSchedulerRule = schedulerRule ?? defaultTaskSchedulerRule()

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden rounded-[28px] border bg-background/55 shadow-2xl backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.12),transparent_32%)]" />
      <header className="relative flex h-[84px] items-center border-b bg-background/35 px-6 backdrop-blur">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Control Center</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">偏好设置</h1>
        </div>
      </header>
      <div className="relative max-w-3xl space-y-4 overflow-auto p-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="font-medium">下载引擎</h2>
              <p className="text-sm text-muted-foreground">
                Grabbit 启动内置 aria2c，并通过 JSON-RPC 管理下载任务。
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="default-download-dir">默认保存目录</Label>
              <div className="flex gap-2">
                <Input
                  id="default-download-dir"
                  placeholder="默认下载目录"
                  value={currentPreferences.downloadDir}
                  onChange={(event) =>
                    onChange({
                      ...currentPreferences,
                      downloadDir: event.target.value,
                    })
                  }
                />
                <Button
                  variant="outline"
                  onClick={() => void onChooseDirectory()}
                >
                  <Folder />
                  选择
                </Button>
              </div>
            </div>
            {enginePaths.length > 0 ? (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium">引擎与配置路径</h3>
                    <p className="text-xs text-muted-foreground">
                      快速查看 aria2、会话与 Grabbit 配置所在位置。
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {enginePaths.map((enginePath) => (
                    <div
                      key={enginePath.key}
                      className="grid gap-2 rounded-md border bg-background p-3 md:grid-cols-[150px_1fr_auto] md:items-center"
                    >
                      <div className="text-sm font-medium">
                        {enginePath.label}
                      </div>
                      <code className="rounded bg-muted px-2 py-1 text-xs break-all text-muted-foreground">
                        {enginePath.path}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void onOpenPath(enginePath.path)}
                      >
                        <Folder />
                        打开
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              <NumberPreference
                id="max-concurrent-downloads"
                label="同时下载任务数"
                min={1}
                max={64}
                value={currentPreferences.maxConcurrentDownloads}
                onChange={(value) =>
                  onChange({
                    ...currentPreferences,
                    maxConcurrentDownloads: value,
                  })
                }
              />
              <NumberPreference
                id="max-connection-per-server"
                label="单服务器连接数"
                min={1}
                max={64}
                value={currentPreferences.maxConnectionPerServer}
                onChange={(value) =>
                  onChange({
                    ...currentPreferences,
                    maxConnectionPerServer: value,
                  })
                }
              />
              <NumberPreference
                id="default-split"
                label="默认分片数"
                min={1}
                max={64}
                value={currentPreferences.split}
                onChange={(value) =>
                  onChange({ ...currentPreferences, split: value })
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextPreference
                id="download-limit"
                label="全局下载限速"
                placeholder="0 表示不限速，如 2M / 512K"
                value={currentPreferences.maxOverallDownloadLimit}
                onChange={(value) =>
                  onChange({
                    ...currentPreferences,
                    maxOverallDownloadLimit: value,
                  })
                }
              />
              <TextPreference
                id="upload-limit"
                label="全局上传限速"
                placeholder="0 表示不限速，如 1M / 256K"
                value={currentPreferences.maxOverallUploadLimit}
                onChange={(value) =>
                  onChange({
                    ...currentPreferences,
                    maxOverallUploadLimit: value,
                  })
                }
              />
            </div>
            <TextPreference
              id="global-proxy"
              label="全局代理"
              placeholder="[http://][USER:PASSWORD@]HOST[:PORT]"
              value={currentPreferences.allProxy}
              onChange={(value) =>
                onChange({ ...currentPreferences, allProxy: value })
              }
            />
            <div className="grid gap-3 md:grid-cols-2">
              <SwitchPreference
                id="continue-downloads"
                label="断点续传"
                description="对应 aria2 continue 选项，关闭后新任务不会自动续传。"
                checked={currentPreferences.continueDownloads}
                onCheckedChange={(checked) =>
                  onChange({
                    ...currentPreferences,
                    continueDownloads: checked,
                  })
                }
              />
              <SwitchPreference
                id="new-task-show-downloading"
                label="添加后跳转到正在下载"
                description="作为新建任务弹窗的默认行为，和 Motrix 的 new-task-show-downloading 对齐。"
                checked={currentPreferences.newTaskShowDownloading}
                onCheckedChange={(checked) =>
                  onChange({
                    ...currentPreferences,
                    newTaskShowDownloading: checked,
                  })
                }
              />
              <SwitchPreference
                id="no-confirm-before-delete-task"
                label="移除任务前不再确认"
                description="启用后单个和批量移除会直接执行；删除本地文件仍只能在确认弹窗中手动勾选。"
                checked={currentPreferences.noConfirmBeforeDeleteTask}
                onCheckedChange={(checked) =>
                  onChange({
                    ...currentPreferences,
                    noConfirmBeforeDeleteTask: checked,
                  })
                }
              />
              <SwitchPreference
                id="open-at-login"
                label="开机自动启动"
                description="保存后通过 Electron login item 注册，和 Motrix 的系统启动项行为对齐。"
                checked={currentPreferences.openAtLogin}
                onCheckedChange={(checked) =>
                  onChange({ ...currentPreferences, openAtLogin: checked })
                }
              />
              <SwitchPreference
                id="resume-all-on-launch"
                label="启动后恢复全部任务"
                description="应用启动并恢复 aria2 会话后自动执行开始全部，用于继续上次未完成任务。"
                checked={currentPreferences.resumeAllOnLaunch}
                onCheckedChange={(checked) =>
                  onChange({
                    ...currentPreferences,
                    resumeAllOnLaunch: checked,
                  })
                }
              />
              <SwitchPreference
                id="close-to-tray"
                label="关闭窗口时隐藏到托盘"
                description="点击窗口关闭按钮时保留 aria2 后台运行，可从托盘重新显示或退出。"
                checked={currentPreferences.closeToTray}
                onCheckedChange={(checked) =>
                  onChange({ ...currentPreferences, closeToTray: checked })
                }
              />
              <SwitchPreference
                id="notify-on-download-complete"
                label="下载完成通知"
                description="任务进入 complete 状态后发送系统通知；启动时已有的历史完成任务不会重复通知。"
                checked={currentPreferences.notifyOnDownloadComplete}
                onCheckedChange={(checked) =>
                  onChange({
                    ...currentPreferences,
                    notifyOnDownloadComplete: checked,
                  })
                }
              />
              <SwitchPreference
                id="show-dock-progress"
                label="显示系统进度条"
                description="根据当前活动任务总体完成度更新 Dock/任务栏进度。"
                checked={currentPreferences.showDockProgress}
                onCheckedChange={(checked) =>
                  onChange({ ...currentPreferences, showDockProgress: checked })
                }
              />
              <div className="space-y-2 rounded-lg border p-3 md:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <SunMoon className="size-4" />
                  主题
                </div>
                <p className="text-xs text-muted-foreground">
                  选择亮色、暗色或跟随系统；保存后会持久化到应用偏好。
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["system", "跟随系统"],
                      ["light", "亮色"],
                      ["dark", "暗色"],
                    ] as const
                  ).map(([theme, label]) => (
                    <Button
                      key={theme}
                      type="button"
                      variant={
                        currentPreferences.theme === theme
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => onChange({ ...currentPreferences, theme })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                保存后会持久化设置，并对正在运行的 aria2 引擎应用全局选项。
              </p>
              <Button
                onClick={() => void onSave(currentPreferences)}
                disabled={!currentPreferences.downloadDir.trim()}
              >
                保存
              </Button>
            </div>
            <Separator />
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>RPC 端口：16800</div>
              <div>同时任务：{currentPreferences.maxConcurrentDownloads}</div>
              <div>
                单服务器连接：{currentPreferences.maxConnectionPerServer}
              </div>
              <div>
                断点续传：
                {currentPreferences.continueDownloads ? "启用" : "关闭"}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="font-medium">BT 与高级引擎</h2>
              <p className="text-sm text-muted-foreground">
                补齐 Motrix 常用的 BT、端口、Tracker 和 User-Agent 全局选项。
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <TextPreference
                id="global-user-agent"
                label="全局 User-Agent"
                placeholder="留空使用 aria2 默认值"
                value={currentPreferences.userAgent}
                onChange={(value) =>
                  onChange({ ...currentPreferences, userAgent: value })
                }
              />
              <div className="flex flex-wrap gap-2">
                {userAgentTemplates.map((template) => (
                  <Button
                    key={template.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...currentPreferences,
                        userAgent: template.value,
                      })
                    }
                  >
                    {template.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange({ ...currentPreferences, userAgent: "" })
                  }
                >
                  清空
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <NumberPreference
                id="seed-ratio"
                label="分享率 Seed Ratio"
                min={0}
                max={100}
                value={currentPreferences.seedRatio}
                onChange={(value) =>
                  onChange({ ...currentPreferences, seedRatio: value })
                }
              />
              <NumberPreference
                id="seed-time"
                label="做种时间 Seed Time（分钟）"
                min={0}
                max={525600}
                value={currentPreferences.seedTime}
                onChange={(value) =>
                  onChange({ ...currentPreferences, seedTime: value })
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextPreference
                id="listen-port"
                label="BT 监听端口"
                placeholder="如 6881"
                value={currentPreferences.listenPort}
                onChange={(value) =>
                  onChange({ ...currentPreferences, listenPort: value })
                }
              />
              <TextPreference
                id="dht-listen-port"
                label="DHT 监听端口"
                placeholder="如 6881"
                value={currentPreferences.dhtListenPort}
                onChange={(value) =>
                  onChange({ ...currentPreferences, dhtListenPort: value })
                }
              />
            </div>
            <LabeledTextarea
              id="bt-tracker"
              label="BT Tracker（每行一个）"
              value={currentPreferences.btTracker}
              onChange={(value) =>
                onChange({ ...currentPreferences, btTracker: value })
              }
            />
            <div className="grid gap-3 md:grid-cols-2">
              <SwitchPreference
                id="bt-save-metadata"
                label="保存磁力链接元数据"
                description="对应 aria2 bt-save-metadata。"
                checked={currentPreferences.btSaveMetadata}
                onCheckedChange={(checked) =>
                  onChange({ ...currentPreferences, btSaveMetadata: checked })
                }
              />
              <SwitchPreference
                id="bt-force-encryption"
                label="强制 BT 加密"
                description="对应 aria2 bt-force-encryption。"
                checked={currentPreferences.btForceEncryption}
                onCheckedChange={(checked) =>
                  onChange({
                    ...currentPreferences,
                    btForceEncryption: checked,
                  })
                }
              />
              <SwitchPreference
                id="follow-torrent"
                label="自动跟随 Torrent"
                description="下载到 torrent 文件后自动添加内容任务。"
                checked={currentPreferences.followTorrent}
                onCheckedChange={(checked) =>
                  onChange({ ...currentPreferences, followTorrent: checked })
                }
              />
              <SwitchPreference
                id="follow-metalink"
                label="自动跟随 Metalink"
                description="下载到 metalink 后自动添加内容任务。"
                checked={currentPreferences.followMetalink}
                onCheckedChange={(checked) =>
                  onChange({ ...currentPreferences, followMetalink: checked })
                }
              />
              <SwitchPreference
                id="enable-upnp"
                label="UPnP / NAT-PMP"
                description="自动映射 BT 端口。"
                checked={currentPreferences.enableUpnp}
                onCheckedChange={(checked) =>
                  onChange({ ...currentPreferences, enableUpnp: checked })
                }
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => void onSave(currentPreferences)}
                disabled={!currentPreferences.downloadDir.trim()}
              >
                保存 BT 与高级引擎设置
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">速度计划</h2>
                <p className="text-sm text-muted-foreground">
                  按星期和时间段自动切换全局下载/上传限速，类似 Motrix
                  的任务计划。
                </p>
              </div>
              <Switch
                id="scheduler-enabled"
                checked={currentSchedulerRule.enabled}
                onCheckedChange={(checked) =>
                  onSchedulerChange({
                    ...currentSchedulerRule,
                    enabled: checked,
                  })
                }
              />
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <TextPreference
                id="scheduler-start"
                label="开始时间"
                placeholder="HH:mm"
                value={currentSchedulerRule.startTime}
                onChange={(value) =>
                  onSchedulerChange({
                    ...currentSchedulerRule,
                    startTime: value,
                  })
                }
              />
              <TextPreference
                id="scheduler-end"
                label="结束时间"
                placeholder="HH:mm"
                value={currentSchedulerRule.endTime}
                onChange={(value) =>
                  onSchedulerChange({ ...currentSchedulerRule, endTime: value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>重复</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={
                      currentSchedulerRule.repeatDays.includes(day.value)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      onSchedulerChange(
                        toggleSchedulerDay(currentSchedulerRule, day.value)
                      )
                    }
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
                    variant={
                      currentSchedulerRule.speedMode === mode.value
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      onSchedulerChange({
                        ...currentSchedulerRule,
                        speedMode: mode.value,
                      })
                    }
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
                  onChange={(value) =>
                    onSchedulerChange({
                      ...currentSchedulerRule,
                      downloadLimit: value,
                    })
                  }
                />
                <TextPreference
                  id="scheduler-upload-limit"
                  label="计划上传限速"
                  placeholder="如 100K / 1M / 0"
                  value={currentSchedulerRule.uploadLimit}
                  onChange={(value) =>
                    onSchedulerChange({
                      ...currentSchedulerRule,
                      uploadLimit: value,
                    })
                  }
                />
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                计划生效时会把全局上传/下载限速切换为
                0（不限速）；计划外恢复偏好设置里的全局限速。
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Grabbit 每分钟检查一次计划；保存后会立即根据当前时间应用。
              </p>
              <Button
                onClick={() => void onSaveScheduler(currentSchedulerRule)}
              >
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
        onChange={(event) =>
          onChange(
            Math.min(max, Math.max(min, Number(event.target.value) || min))
          )
        }
      />
    </div>
  )
}

function SwitchPreference({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
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

