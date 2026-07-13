import {
  FileText,
  FileUp,
  Film,
  Image,
  Loader2,
  Music,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  isMediaTorrentFile,
  type ParsedTorrentInfo,
} from "../../../shared/grabbit"
import { formatBytes } from "../../lib/task-display"

export function TorrentSelector({
  torrentPath,
  torrentInfo,
  selectedIndexes,
  loading,
  onChoose,
  onClear,
  onSelectionChange,
}: {
  torrentPath: string
  torrentInfo: ParsedTorrentInfo | null
  selectedIndexes: Set<number>
  loading: boolean
  onChoose: () => void
  onClear: () => void
  onSelectionChange: (indexes: Set<number>) => void
}) {
  const selectedFiles =
    torrentInfo?.files.filter((file) => selectedIndexes.has(file.index)) ?? []
  const selectedSize = selectedFiles.reduce((sum, file) => sum + file.length, 0)
  const allSelected =
    Boolean(torrentInfo?.files.length) &&
    selectedIndexes.size === torrentInfo?.files.length

  const toggleIndex = (index: number, checked: boolean) => {
    const next = new Set(selectedIndexes)
    if (checked) {
      next.add(index)
    } else {
      next.delete(index)
    }
    onSelectionChange(next)
  }

  const selectFiles = (indexes: number[]) => onSelectionChange(new Set(indexes))
  const selectByKind = (kind: "video" | "audio" | "image" | "document") => {
    selectFiles(
      torrentInfo?.files
        .filter((file) => isMediaTorrentFile(file, kind))
        .map((file) => file.index) ?? []
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div className="flex items-start gap-3">
        <FileUp className="mt-1 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label>种子文件</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                选择本地 .torrent 后会先解析文件列表，可选择部分文件再通过
                aria2.addTorrent 提交。
              </p>
            </div>
            {torrentPath ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                title="清除种子"
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={torrentPath}
              placeholder="尚未选择 .torrent 文件"
              readOnly
            />
            <Button variant="outline" onClick={onChoose} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              选择文件
            </Button>
          </div>
        </div>
      </div>

      {torrentInfo ? (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium break-all">
                {torrentInfo.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                已选择 {selectedFiles.length} / {torrentInfo.files.length}{" "}
                个文件 · {formatBytes(selectedSize)} /{" "}
                {formatBytes(torrentInfo.totalLength)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  selectFiles(torrentInfo.files.map((file) => file.index))
                }
              >
                全选
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectFiles([])}
              >
                全不选
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByKind("video")}
            >
              <Film /> 视频
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByKind("audio")}
            >
              <Music /> 音频
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByKind("image")}
            >
              <Image /> 图片
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByKind("document")}
            >
              <FileText /> 文档
            </Button>
            <Badge variant={allSelected ? "secondary" : "outline"}>
              {allSelected ? "全部文件" : "部分文件"}
            </Badge>
          </div>

          <div className="max-h-64 overflow-auto rounded-md border bg-background">
            <div className="divide-y">
              {torrentInfo.files.map((file) => (
                <label
                  key={`${file.index}-${file.path}`}
                  className="flex cursor-pointer items-start gap-3 p-3 text-sm hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selectedIndexes.has(file.index)}
                    onCheckedChange={(checked) =>
                      toggleIndex(file.index, checked === true)
                    }
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium break-all">{file.path}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      #{file.index} ·{" "}
                      {file.extension
                        ? file.extension.replace(/^\./, "").toUpperCase()
                        : "无扩展名"}{" "}
                      · {formatBytes(file.length)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
