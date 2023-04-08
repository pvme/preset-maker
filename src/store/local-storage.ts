import { ImportData } from "../types/import-data";
import { ItemData } from "../types/item-data";
import { sanitizedData } from "../utility/sanitizer";

class LocalStorage {
  PRESETS_KEY = 'presets';

  loadPresets() {
    const lsPresets = window.localStorage.getItem(this.PRESETS_KEY);
    if (lsPresets) {
      const itemData: ImportData[] = JSON.parse(lsPresets);
      return itemData;
    }

    return [];
  }

  savePresetWithoutConfirmation({
    presetName,
    inventorySlots,
    equipmentSlots
  }: {
    presetName: string,
    inventorySlots: ItemData[],
    equipmentSlots: ItemData[]
  }) {
    debugger;
    const data = sanitizedData(inventorySlots, equipmentSlots);
    const currentPresets = this.loadPresets();

    const isExistingPreset = this._isMatchingExistingPreset(currentPresets, presetName);
    const updatedPresets = isExistingPreset
      ? this._replacePreset(currentPresets, {
        presetName,
        inventorySlots: data.inventory,
        equipmentSlots: data.equipment
      })
      : currentPresets.concat({
        presetName,
        inventorySlots: data.inventory,
        equipmentSlots: data.equipment
      });
    window.localStorage.setItem(this.PRESETS_KEY, JSON.stringify(updatedPresets));
  }

  savePresetWithConfirmation({
    presetName,
    inventorySlots,
    equipmentSlots
  }: {
    presetName: string,
    inventorySlots: ItemData[],
    equipmentSlots: ItemData[]
  }) {
    const data = sanitizedData(inventorySlots, equipmentSlots);
    const currentPresets = this.loadPresets();

    const isExistingPreset = this._isMatchingExistingPreset(currentPresets, presetName);
    if (isExistingPreset) {
      const didConfirmDeletion = window.confirm(
        `Are you sure you wish to overwrite the existing "${presetName}" preset?`
      );
      if (!didConfirmDeletion) {
        return false;
      }
    }

    const updatedPresets = isExistingPreset
      ? this._replacePreset(currentPresets, {
        presetName,
        inventorySlots: data.inventory,
        equipmentSlots: data.equipment
      })
      : currentPresets.concat({
        presetName,
        inventorySlots: data.inventory,
        equipmentSlots: data.equipment
      });
    window.localStorage.setItem(this.PRESETS_KEY, JSON.stringify(updatedPresets));
    return true;
  }

  _replacePreset(currentPresets: ImportData[], presetToReplace: ImportData) {
    return currentPresets.map((preset) => {
      if (preset.presetName === presetToReplace.presetName) {
        return {
          presetName: presetToReplace.presetName,
          inventorySlots: presetToReplace.inventorySlots,
          equipmentSlots: presetToReplace.equipmentSlots
        };
      }

      return preset;
    });
  }

  _isMatchingExistingPreset(currentPresets: ImportData[], presetName: string) {
    return currentPresets.findIndex((preset) =>
      preset.presetName.toLocaleUpperCase() === presetName.toLocaleUpperCase()) !== -1;
  }
}

const defaultInstance = new LocalStorage();
export {
  defaultInstance as LocalStorage
};

