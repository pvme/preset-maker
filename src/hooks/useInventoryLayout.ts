import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export type InventoryLayout = "7x4" | "4x7";
const STORAGE_KEY = "preset-maker:inventory-layout";

export function useInventoryLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState<InventoryLayout>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "7x4" || saved === "4x7") return saved;
    } catch { /* The view still works when browser storage is unavailable. */ }
    return window.matchMedia("(max-width:900px)").matches ? "4x7" : "7x4";
  });

  const changeLayout = (value: InventoryLayout) => {
    setLayout(value);
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.set("layout", value);
      return next;
    }, { replace: true });
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Session-only preference. */ }
  };

  // Embed links use hash routes such as #/PRESET_ID?layout=4x7. The URL is
  // authoritative when present, while the saved/device choice remains the
  // default for ordinary editor visits.
  const sharedLayout = searchParams.get("layout");
  const activeLayout = sharedLayout === "4x7" || sharedLayout === "7x4"
    ? sharedLayout
    : layout;
  return [activeLayout, changeLayout] as const;
}
