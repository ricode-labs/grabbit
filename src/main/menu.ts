import { app, dialog, Menu, type MenuItemConstructorOptions } from "electron"

import { callAria2 } from "./aria2"
import { sendExternalIntents } from "./external-intents"

export const createNativeMenu = () => {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          } satisfies MenuItemConstructorOptions,
        ]
      : []),
    {
      label: "任务",
      submenu: [
        {
          label: "新建下载任务",
          accelerator: "CmdOrCtrl+N",
          click: () =>
            sendExternalIntents([
              { kind: "command", value: "menu:new-task", command: "new-task" },
            ]),
        },
        {
          label: "打开 Torrent 文件…",
          accelerator: "CmdOrCtrl+O",
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
        { label: "暂停全部", click: () => void callAria2("aria2.pauseAll") },
        { label: "开始全部", click: () => void callAria2("aria2.unpauseAll") },
      ],
    },
    {
      label: "视图",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "窗口",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
