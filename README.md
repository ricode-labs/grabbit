# Grabbit

<p align="center">
  <img src="./src/renderer/assets/logo.svg" width="96" alt="Grabbit logo" />
</p>

<p align="center">
  <strong>一款基于 aria2 的轻量下载管理器。</strong><br />
  奶油粉色界面、清晰任务列表、细致下载详情，适合把日常下载整理得更安静一点。
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-43.1.0-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="React" src="https://img.shields.io/badge/React-18.2-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="aria2" src="https://img.shields.io/badge/aria2-powered-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
</p>

## 特性

- **多类型下载**：支持 HTTP、HTTPS、FTP、SFTP、Magnet 和 Torrent 文件。
- **任务管理**：暂停、恢复、删除任务；删除时可选择是否同时删除本地文件。
- **多语言**：内置中文、English、日本語。
- **浏览器插件联动**：配套浏览器插件可以把网页里的下载链接直接交给 Grabbit，快速跳转到本软件新建下载。

## 浏览器插件

Grabbit 提供配套浏览器插件，用来减少“复制链接 -> 打开软件 -> 粘贴链接”的步骤。

安装插件后，你可以在浏览器中直接把当前下载链接发送到 Grabbit。Grabbit 会唤起新建任务窗口并带入链接，后续只需要确认保存目录和文件信息即可开始下载。

适合这些场景：

- 网页下载按钮很多，不想反复复制链接。
- 需要把大文件交给 aria2 管理。
- 想统一查看下载进度、速度、历史记录和本地文件删除操作。


## 常用流程

1. 打开 Grabbit。
2. 点击“新增下载”，或通过浏览器插件直接发送下载链接。
3. 确认文件信息和保存目录。
4. 开始下载，在列表中查看进度。
5. 点击任务查看详情，必要时暂停、恢复或删除。

## License

MIT
