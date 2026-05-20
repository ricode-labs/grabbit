export const engineProfiles = [
  ["Concurrent tasks", "5 active", "Motrix-style global queue cap"],
  ["Connections per task", "16 / 64", "Split downloads across mirrors"],
  ["Download limit", "100 MB/s", "Global cap, adjustable per session"],
  ["Upload limit", "12 MB/s", "BT seeding and sharing cap"],
]

export const btOptions = [
  ["DHT network", "On", "Discover peers without trackers"],
  ["Peer exchange", "On", "Share known peers across the swarm"],
  ["Local peer discovery", "On", "Find peers on the local network"],
  ["Auto update trackers", "Daily", "Keep public tracker lists fresh"],
]

export const integrationOptions = [
  ["Browser capture", "Enabled", "Catch downloads from Chrome, Edge, Firefox"],
  ["User agent", "Motrix compatible", "Improve compatibility with protected hosts"],
  ["System tray", "Minimize to tray", "Keep downloads running in background"],
  ["Notifications", "Completed + failed", "Desktop alerts for task events"],
]

export const history = [
  ["debian-live-13.0.iso", "3.7 GB", "Today 11:42"],
  ["node-v26-linux-x64.tar.xz", "48 MB", "Yesterday"],
  ["fedora-workstation.iso", "2.1 GB", "May 17"],
]
