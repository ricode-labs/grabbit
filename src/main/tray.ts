import { Menu, nativeImage, Tray } from "electron"

import { BrowserWindow } from "electron/main"

// save a reference to the Tray object globally to avoid garbage collection
let tray = null

export function createTray() {
  const image = nativeImage.createFromDataURL(
    "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#18181b"/><path d="M16 6v14m0 0 6-6m-6 6-6-6M9 25h14" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      )
  )
  // image.setTemplateImage(process.platform === "darwin")
  tray = new Tray(image)
  tray.setToolTip("Grabbit")
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open App",
      click: () => {
        const wins = BrowserWindow.getAllWindows()
        if (wins.length === 0) {
          // createWindow()
        } else {
          wins[0].show()
          wins[0].focus()
        }
      },
    },
    { role: "toggleDevTools" },
    { role: "quit" },
  ])

  tray.setContextMenu(contextMenu)
  // tray.setContextMenu(
  //   Menu.buildFromTemplate([
  //     { label: "显示 Grabbit", click: showMainWindow },
  //     {
  //       label: "新建下载任务",
  //       click: () =>
  //         sendExternalIntents([
  //           { kind: "command", value: "tray:new-task", command: "new-task" },
  //         ]),
  //     },
  //     {
  //       label: "打开 Torrent 文件…",
  //       click: async () => {
  //         const { canceled, filePaths } = await dialog.showOpenDialog({
  //           properties: ["openFile"],
  //           filters: [{ name: "Torrent", extensions: ["torrent"] }],
  //         })
  //         if (!canceled) {
  //           sendExternalIntents(
  //             filePaths.map((filePath) => ({
  //               kind: "torrent",
  //               value: filePath,
  //             }))
  //           )
  //         }
  //       },
  //     },
  //     { type: "separator" },
  //     { label: "退出", click: () => app.quit() },
  //   ])
  // )

  // tray.on("click", showMainWindow)
}
