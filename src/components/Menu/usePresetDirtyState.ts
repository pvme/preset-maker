// src/components/Menu/usePresetDirtyState.ts

import { useEffect, useRef, useState } from "react";
import { presetsAreEqual } from "../../utility/comparePresets";

function stripUIState(preset: any) {
  if (!preset) return preset;

  const {
    slotType,
    slotIndex,
    selectedSlots,
    slotKey,
    ...clean
  } = preset;

  return clean;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function usePresetDirtyState(preset: any) {
  const lastSavedRef = useRef<any>(null);
  const [isDirty, setIsDirty] = useState<boolean | null>(null);

  const signature = JSON.stringify(stripUIState(preset));

  const markClean = () => {
    lastSavedRef.current = deepClone(stripUIState(preset));
    setIsDirty(false);
  };

  useEffect(() => {
    if (!preset) {
      setIsDirty(null);
      return;
    }

    // establish baseline once per loaded preset
    if (!lastSavedRef.current) {
      lastSavedRef.current = deepClone(stripUIState(preset));
      setIsDirty(false);
      return;
    }

    const current = deepClone(stripUIState(preset));
    const clean = lastSavedRef.current;

    setIsDirty(!presetsAreEqual(current, clean));
  }, [signature]);

  return {
    isDirty,
    markClean,
  };
}
