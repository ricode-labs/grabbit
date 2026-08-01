export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}

export function extractFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = decodeURIComponent(urlObj.pathname)
    const fileName = pathname.split("/").pop() || "download"
    // 移除查询参数和锚点
    return fileName.split("?")[0].split("#")[0] || "download"
  } catch {
    // 如果 URL 解析失败，尝试简单的字符串分割
    const parts = url.split("/")
    const lastPart = parts[parts.length - 1]
    if (lastPart) {
      return lastPart.split("?")[0].split("#")[0] || "download"
    }
    return "download"
  }
}
