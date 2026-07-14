import { app, dialog, Menu, nativeImage, Tray } from "electron"

import { getTray, setTray } from "./app-state"
import { sendExternalIntents } from "./external-intents"
import { showMainWindow } from "./window"

export const createTray = () => {
  if (getTray()) {
    return
  }

  const image = nativeImage.createFromDataURL(
    "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#18181b"/><path d="M16 6v14m0 0 6-6m-6 6-6-6M9 25h14" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      )
  )
  image.setTemplateImage(process.platform === "darwin")

  const tray = new Tray(image)
  setTray(tray)
  tray.setToolTip("Grabbit")
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示 Grabbit", click: showMainWindow },
      {
        label: "新建下载任务",
        click: () =>
          sendExternalIntents([
            { kind: "command", value: "tray:new-task", command: "new-task" },
          ]),
      },
      {
        label: "打开 Torrent 文件…",
        click: async () => {
          const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ["openFile"],
            filters: [{ name: "Torrent", extensions: ["torrent"] }],
          })
          if (!canceled) {
            sendExternalIntents(
              filePaths.map((filePath) => ({
                kind: "torrent",
                value: filePath,
              }))
            )
          }
        },
      },
      { type: "separator" },
      { label: "退出", click: () => app.quit() },
    ])
  )
  tray.on("click", showMainWindow)
}
