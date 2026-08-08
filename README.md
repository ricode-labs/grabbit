# Grabbit

<p align="center">
  <img src="./src/renderer/assets/logo.svg" width="96" alt="Grabbit logo" />
</p>

<p align="center">
  <strong>基于 aria2 的跨平台下载管理器</strong><br />
  好看、易用、功能强大。
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-43.2.0-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="React" src="https://img.shields.io/badge/React-19.2-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="aria2" src="https://img.shields.io/badge/aria2-powered-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-FFB8C8?labelColor=FFF8F7&color=FF7D90" />
</p>

## 功能

- 支持 HTTP、HTTPS、FTP、SFTP、Magnet、`.torrent` 和 Metalink 下载
- 暂停、恢复、删除任务，并可选择同时删除已下载文件
- 查看下载进度、速度、连接数、文件列表和错误信息
- 支持下载速度、上传速度和最大并发数设置
- 支持浅色/深色主题，以及中文、English、日本語
- 自动更新 BitTorrent tracker，并支持 UPnP/NAT-PMP/PCP 端口映射
- 支持通过 `grabbit://` 协议从其他应用发送下载链接

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
