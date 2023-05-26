import { type SavedPresetData } from '../types/saved-preset-data';
import { sanitizePresetData } from '../utility/sanitizer';

/**
 * Handles read/writes to localStorage. Currently used for:
 *
 * - Saved presets
 */
class LocalStorage {
  PRESETS_KEY = 'presets';

  loadPresets (): SavedPresetData[] {
    const localStoragePresets = window.localStorage.getItem(this.PRESETS_KEY);
    if (localStoragePresets !== undefined && localStoragePresets !== null) {
      const presetData: SavedPresetData[] = JSON.parse(localStoragePresets);
      return presetData;
    }

    return [];
  }

  savePresetWithoutConfirmation (presetData: SavedPresetData): void {
    const presetName = presetData.presetName;
    const sanitizedPresetData = sanitizePresetData(presetData);
    const currentPresets = this.loadPresets();

    const isExistingPreset = this._isMatchingExistingPreset(currentPresets, presetName);
    const updatedPresets = isExistingPreset
      ? this._replacePreset(currentPresets, sanitizedPresetData)
      : currentPresets.concat(sanitizedPresetData);
    window.localStorage.setItem(this.PRESETS_KEY, JSON.stringify(updatedPresets));
  }

  savePresetWithConfirmation (presetData: SavedPresetData): boolean {
    const presetName = presetData.presetName;
    const sanitizedPresetData = sanitizePresetData(presetData);
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
      ? this._replacePreset(currentPresets, sanitizedPresetData)
      : currentPresets.concat(sanitizedPresetData);
    window.localStorage.setItem(this.PRESETS_KEY, JSON.stringify(updatedPresets));
    return true;
  }

  _replacePreset (currentPresets: SavedPresetData[], presetToReplace: SavedPresetData): SavedPresetData[] {
    return currentPresets.map((preset) => {
      if (preset.presetName === presetToReplace.presetName) {
        return {
          ...presetToReplace
        };
      }

      return preset;
    });
  }

  _isMatchingExistingPreset (currentPresets: SavedPresetData[], presetName: string): boolean {
    return currentPresets.findIndex((preset) =>
      preset.presetName.toLocaleUpperCase() === presetName.toLocaleUpperCase()) !== -1;
  }
}

const defaultInstance = new LocalStorage();
export {
  defaultInstance as LocalStorage
};
