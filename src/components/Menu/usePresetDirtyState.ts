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

export function usePresetDirtyState(preset: any) {
  const lastSavedRef = useRef<any>(null);
  const [isDirty, setIsDirty] = useState<boolean | null>(null);

  const markClean = (snapshot: any) => {
    lastSavedRef.current = stripUIState(
      JSON.parse(JSON.stringify(snapshot))
    );
    setIsDirty(false);
  };

  useEffect(() => {
    if (!lastSavedRef.current) {
      setIsDirty(false);
      return;
    }

    const clean = stripUIState(lastSavedRef.current);
    const current = stripUIState(preset);

    setIsDirty(!presetsAreEqual(current, clean));
  }, [preset]);

  return {
    isDirty,
    markClean,
    lastSavedRef,
  };
}
