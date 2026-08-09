# Grabbit

<p align="center">
  <img src="./src/renderer/assets/logo.svg" width="96" alt="Grabbit logo" />
</p>

<p align="center">
  <strong>基于 aria2 的跨平台下载管理器</strong><br />
  好看、易用、功能强大。
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.ja.md">日本語</a>
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-42-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="React" src="https://img.shields.io/badge/React-19-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="shadcn" src="https://img.shields.io/badge/shadcn-4-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="Platforms" src="https://img.shields.io/badge/platforms-Linux%20%7C%20macOS%20%7C%20Windows-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
</p>

## 功能

- 支持 HTTP、HTTPS、FTP、Magnet、`.torrent` 和 Metalink 下载
- 支持浅色/深色主题，以及中文、English、日本語
- 自动更新 BitTorrent tracker，并支持 UPnP/NAT-PMP/PCP 端口映射

## 浏览器插件

Grabbit 提供配套浏览器插件，用来减少“复制链接 -> 打开软件 -> 粘贴链接”的步骤以及提高下载的成功率。

安装插件后，无须做任何配置，每当浏览器有下载，会自动发给Grabbit，无须任何手动操作。

适合这些场景：

- 不想反复复制链接。
- 不仅要复制链接，还要复制Cookie等信息才能成功的下载。

Grabbit 插件会自动为你做这些事情。

## 支持平台

当前打包配置包含以下平台和架构：

- Linux x64
- macOS arm64
- Windows x64

## 下载安装

安装包发布在 [GitHub Releases](https://github.com/ricode-labs/grabbit/releases) 页面。请根据系统下载对应文件：

- Linux x64：`Grabbit-linux-x64.flatpak`
- macOS arm64：`Grabbit-macos-arm64.pkg`
- Windows x64：`Grabbit-windows-x64-setup.exe`

### Linux

需要先安装 Flatpak，然后双击 `.flatpak` 文件，或在终端执行：

```bash
flatpak install --user ./Grabbit-linux-x64.flatpak
```

### Windows

下载并运行 `Grabbit-windows-x64-setup.exe`，按照安装程序提示完成安装。

### macOS

macOS 安装包目前没有经过 Apple 签名和公证，系统可能提示“无法验证开发者”或“无法确认开发者身份”。首次安装时请按以下步骤操作：

1. 下载 `Grabbit-macos-arm64.pkg`，双击运行安装程序。
2. 如果 macOS 阻止打开安装程序，点击提示中的“完成”或关闭提示。
3. 打开“系统设置”->“隐私与安全性”。
4. 在“安全性”区域找到关于 Grabbit 被阻止的提示，点击“仍要打开”。
5. 根据系统提示输入密码或使用 Touch ID 确认，然后重新打开 `.pkg` 安装程序。
6. 按照安装向导完成安装

也可以在 Finder 中按住 Control 键并点击安装包或 Grabbit，选择“打开”，然后在确认窗口中点击“打开”。

## License

MIT
