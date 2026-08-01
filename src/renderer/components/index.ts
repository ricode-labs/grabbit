/**
 * 组件统一导出
 * 将所有组件从这里导出，支持简化的导入方式
 *
 * 使用例:
 * import { TitleBar, Sidebar, DownloadList } from './components'
 */

// Layout Components
export { TitleBar } from "./TitleBar"
export { Sidebar } from "./Sidebar"
export { StatusBar } from "./StatusBar"
export { WindowControls } from "./WindowControls"

// Download Components
export { DownloadList, type CategoryType } from "./DownloadList"
export { DownloadItem } from "./DownloadItem"
export { DownloadDetail } from "./DownloadDetail"

// Modal Components
export { AddDownloadModal } from "./AddDownloadModal"
export { DeleteConfirmModal } from "./DeleteConfirmModal"
export { NoticeModal } from "./ui/NoticeModal"

// Settings Component
export { SettingsPage } from "./SettingsPage"
