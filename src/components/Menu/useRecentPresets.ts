// src/components/Menu/useRecentPresets.ts

import { useCallback, useEffect, useState } from "react";
import { PresetSummary } from "../../schemas/preset-summary";

export function useRecentPresets() {
  const [recentList, setRecentList] = useState<PresetSummary[]>([]);

  const refresh = useCallback(() => {
    setRecentList(
      JSON.parse(localStorage.getItem("recentPresets") || "[]")
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    recentList,
    refresh,
    setRecentList,
  };
}
