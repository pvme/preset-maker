// src/components/Menu/usePresetJsonExport.ts

import { useCallback } from "react";
import { exportAsJson } from "../../utility/export-to-json";
import { sanitizeAndStringifyPreset } from "../../utility/sanitizer";

export function usePresetJsonExport(preset: {
  presetName: string;
  presetNotes: string;
  inventorySlots: any[];
  equipmentSlots: any[];
  relics: any;
  familiars: any;
  breakdown: any[];
}) {
  const exportJson = useCallback(() => {
    const str = sanitizeAndStringifyPreset({
      presetName: preset.presetName,
      presetNotes: preset.presetNotes,
      inventorySlots: preset.inventorySlots,
      equipmentSlots: preset.equipmentSlots,
      relics: preset.relics,
      familiars: preset.familiars,
      breakdown: preset.breakdown,
    });

    exportAsJson(
      `PRESET_${preset.presetName.replaceAll(" ", "_")}`,
      str
    );
  }, [preset]);

  return {
    exportJson,
  };
}
