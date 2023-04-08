import { ImportData } from "../types/import-data";

class LocalStorage {
  loadPresets() {
    const lsPresets = window.localStorage.getItem("presets");
    if (lsPresets) {
      const itemData: ImportData[] = JSON.parse(lsPresets);
      return itemData;
    }

    return [];
  }
}

export default new LocalStorage();
