import type { Preferences } from "../shared/types";
import Store from 'electron-store';

const store = new Store<Preferences>();

export const preferences: Preferences = {
  maxOverallDownloadLimit: store.get("maxOverallDownloadLimit", 0)
}