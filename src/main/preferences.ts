import type { Preferences } from "../shared/types";
import Store from 'electron-store';
import { downloadDirectoryPath } from "./paths";

const store = new Store<Preferences>();

export const preferences: Preferences = {
  maxOverallDownloadLimit: store.get("maxOverallDownloadLimit", 0),
  maxOverallUploadLimit: store.get("maxOverallUploadLimit", 0),
  downloadDirectoryPath: store.get("downloadDirectoryPath", downloadDirectoryPath)
}