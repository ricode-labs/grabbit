import { useEffect, useState } from "react"
import { Clipboard, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  calculateProgress,
  flattenAnnounceList,
  summarizeFiles,
  summarizePeers,
  toFiniteNumber,
} from "../../../shared/grabbit"
import type { Aria2Peer, Aria2Server } from "../../../shared/aria2"
import {
  type Aria2Task,
  formatBytes,
  getProgress,
  getTaskName,
  getTaskUris,
  statusText,
  type TaskStatus,
} from "../../lib/task-display"

export function TaskDetails({
  task,
  onCopy,
  onOpenPath,
}: {
  task: Aria2Task
  onCopy: (text: string, message: string) => void
  onOpenPath: (targetPath: string) => void
}) {
  const [peers, setPeers] = useState<Aria2Peer[]>([])
  const [servers, setServers] = useState<Aria2Server[]>([])
  const [networkLoading, setNetworkLoading] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const taskUris = getTaskUris(task)
  const progress = getProgress(task)
  const taskPath = task.files?.[0]?.path || task.dir
  const taskStatus = task.status as TaskStatus
  const fileSummary = summarizeFiles(task.files ?? [])
  const trackers = flattenAnnounceList(task.bittorrent?.announceList)
  const peerSummary = summarizePeers(peers)
  const activityRows = [
    { label: "任务 GID", value: task.gid },
    { label: "当前状态", value: statusText[taskStatus] ?? task.status },
    { label: "下载速度", value: `${formatBytes(task.downloadSpeed)}/s` },
    { label: "上传速度", value: `${formatBytes(task.uploadSpeed)}/s` },
    { label: "连接数", value: task.connections || "0" },
    { label: "做种数", value: task.numSeeders || "0" },
    { label: "校验完成", value: formatBytes(task.verifiedLength) },
    {
      label: "等待校验",
      value: task.verifyIntegrityPending === "true" ? "是" : "否",
    },
  ]

  useEffect(() => {
    let cancelled = false

    const loadNetworkDetails = async () => {
      setNetworkLoading(true)
      setNetworkError(null)
      try {
        const [nextPeers, nextServers] = await Promise.all([
          window.aria2.getPeers({ gid: task.gid }),
          window.aria2.getServers({ gid: task.gid }),
        ])
        if (!cancelled) {
          setPeers(nextPeers)
          setServers(nextServers)
        }
      } catch (error) {
        if (!cancelled) {
          setPeers([])
          setServers([])
          setNetworkError(
            error instanceof Error ? error.message : "读取 BT 网络详情失败"
          )
        }
      } finally {
        if (!cancelled) {
          setNetworkLoading(false)
        }
      }
    }

    void loadNetworkDetails()
    const timer = window.setInterval(loadNetworkDetails, 3000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [task.gid])

  return (
    <Tabs defaultValue="activity" className="min-h-0 flex-1 px-4 py-4">
      <TabsList className="shrink-0">
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="trackers">Trackers</TabsTrigger>
        <TabsTrigger value="peers">Peers</TabsTrigger>
      </TabsList>
      <ScrollArea className="mt-4 h-[calc(86vh-210px)] pr-3">
        <TabsContent value="activity" className="mt-0 space-y-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <DetailItem label="名称" value={getTaskName(task)} />
            <DetailItem label="保存目录" value={task.dir || "-"} />
            <DetailItem label="总大小" value={formatBytes(task.totalLength)} />
            <DetailItem
              label="已完成"
              value={formatBytes(task.completedLength)}
            />
            <DetailItem
              label="文件"
              value={`${fileSummary.selectedCount}/${fileSummary.count} 已选择`}
            />
            <DetailItem label="BT 模式" value={task.bittorrent?.mode || "-"} />
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">进度</h3>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(task.completedLength)} /{" "}
                  {formatBytes(task.totalLength)}
                </p>
              </div>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {activityRows.map((row) => (
              <DetailItem key={row.label} label={row.label} value={row.value} />
            ))}
          </div>

          {task.errorCode || task.errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="font-medium">错误 {task.errorCode || ""}</div>
              <div className="mt-1 break-all">
                {task.errorMessage || "aria2 未返回错误详情"}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">原始链接</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(taskUris.join("\n"), "任务链接已复制")}
                disabled={taskUris.length === 0}
              >
                <Clipboard /> 复制全部
              </Button>
            </div>
            {taskUris.length > 0 ? (
              <div className="space-y-2">
                {taskUris.map((uri) => (
                  <div
                    key={uri}
                    className="flex items-start justify-between gap-2 rounded-md bg-muted/40 p-2 text-xs"
                  >
                    <code className="min-w-0 break-all">{uri}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => onCopy(uri, "链接已复制")}
                    >
                      <Clipboard />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                aria2
                没有返回原始链接；种子任务或部分历史记录可能只包含文件信息。
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-0 space-y-3">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <DetailItem label="文件数" value={String(fileSummary.count)} />
            <DetailItem
              label="已选"
              value={String(fileSummary.selectedCount)}
            />
            <DetailItem
              label="总大小"
              value={formatBytes(fileSummary.totalLength)}
            />
            <DetailItem label="完成" value={`${fileSummary.progress}%`} />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenPath(taskPath)}
              disabled={!taskPath}
            >
              <ExternalLink /> 打开位置
            </Button>
          </div>
          {task.files?.length ? (
            <div className="divide-y rounded-md border">
              {task.files.map((file, index) => {
                const fileProgress = calculateProgress(
                  file.completedLength,
                  file.length
                )
                const fileUris =
                  file.uris?.map((uri) => uri.uri).filter(Boolean) ?? []
                return (
                  <div
                    key={`${file.path}-${index}`}
                    className="space-y-2 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium break-all">
                          {file.path || `文件 ${file.index ?? index + 1}`}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          #{file.index ?? index + 1} ·{" "}
                          {formatBytes(file.completedLength)} /{" "}
                          {formatBytes(file.length)} ·{" "}
                          {file.selected === "true" ? "已选择" : "未选择"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => onCopy(file.path, "文件路径已复制")}
                      >
                        <Clipboard />
                      </Button>
                    </div>
                    <Progress value={fileProgress} />
                    {fileUris.length > 0 ? (
                      <div className="space-y-1 rounded-md bg-muted/30 p-2 text-xs">
                        {fileUris.map((uri) => (
                          <div key={uri} className="break-all">
                            {uri}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无文件信息。</p>
          )}
        </TabsContent>

        <TabsContent value="trackers" className="mt-0 space-y-3">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <DetailItem label="Tracker 数" value={String(trackers.length)} />
            <DetailItem
              label="BT 名称"
              value={task.bittorrent?.info?.name || "-"}
            />
            <DetailItem
              label="创建时间"
              value={
                task.bittorrent?.creationDate
                  ? new Date(
                      toFiniteNumber(task.bittorrent.creationDate) * 1000
                    ).toLocaleString()
                  : "-"
              }
            />
          </div>
          {task.bittorrent?.comment ? (
            <div className="rounded-lg border p-3 text-sm">
              <div className="text-xs text-muted-foreground">Comment</div>
              <div className="mt-1 break-all">{task.bittorrent.comment}</div>
            </div>
          ) : null}
          {trackers.length > 0 ? (
            <div className="divide-y rounded-md border">
              {trackers.map((tracker) => (
                <div
                  key={tracker}
                  className="flex items-start justify-between gap-2 p-3 text-sm"
                >
                  <code className="min-w-0 break-all">{tracker}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => onCopy(tracker, "Tracker 已复制")}
                  >
                    <Clipboard />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              aria2 暂未返回 Tracker 列表；HTTP 任务不会包含该信息。
            </p>
          )}
        </TabsContent>

        <TabsContent value="peers" className="mt-0 space-y-3">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <DetailItem
              label="Peer 数"
              value={networkLoading ? "读取中..." : String(peerSummary.count)}
            />
            <DetailItem label="Seeder" value={String(peerSummary.seeders)} />
            <DetailItem
              label="下行"
              value={`${formatBytes(peerSummary.downloadSpeed)}/s`}
            />
            <DetailItem
              label="上行"
              value={`${formatBytes(peerSummary.uploadSpeed)}/s`}
            />
          </div>
          {networkError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {networkError}
            </p>
          ) : null}
          {peers.length > 0 ? (
            <div className="divide-y rounded-md border">
              {peers.map((peer, index) => (
                <div
                  key={`${peer.ip}-${peer.port}-${index}`}
                  className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="font-medium break-all">
                      {peer.ip}:{peer.port}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {peer.peerId || "未知客户端"} ·{" "}
                      {peer.seeder === "true" ? "Seeder" : "Leecher"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground md:text-right">
                    ↓ {formatBytes(peer.downloadSpeed)}/s · ↑{" "}
                    {formatBytes(peer.uploadSpeed)}/s
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              暂无 Peer 信息；非 BT 任务或无活动连接时为空。
            </p>
          )}
          {servers.length > 0 ? (
            <div className="space-y-2 rounded-lg border p-3">
              <h3 className="text-sm font-medium">HTTP/FTP Servers</h3>
              {servers
                .flatMap((entry) =>
                  entry.servers.map((server) => ({
                    ...server,
                    index: entry.index,
                  }))
                )
                .map((server) => (
                  <div
                    key={`${server.index}-${server.uri}`}
                    className="rounded-md bg-muted/30 p-2 text-xs"
                  >
                    <div className="font-medium break-all">
                      #{server.index} {server.currentUri || server.uri}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {formatBytes(server.downloadSpeed)}/s
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  )
}
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium break-all">{value || "-"}</div>
    </div>
  )
}
