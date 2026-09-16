import { useState } from "react";

export type InventoryLayout = "7x4" | "4x7";
const STORAGE_KEY = "preset-maker:inventory-layout";

export function useInventoryLayout() {
  const [layout, setLayout] = useState<InventoryLayout>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "7x4" || saved === "4x7") return saved;
    } catch { /* The view still works when browser storage is unavailable. */ }
    return window.matchMedia("(max-width:900px)").matches ? "4x7" : "7x4";
  });

  const changeLayout = (value: InventoryLayout) => {
    setLayout(value);
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Session-only preference. */ }
  };

  return [layout, changeLayout] as const;
}
