// src/hooks/useEmojiMap.ts
import { useEffect, useState } from "react";
import { loadEmojis, type EmojiMaps, type EmojiEntry } from "../emoji";
import { setEmojiIndex } from "../emoji/globalEmojiIndex";

/**
 * Re-export types so other modules can import from here.
 */
export type { EmojiMaps, EmojiEntry };

export function useEmojiMap() {
  const [maps, setMaps] = useState<EmojiMaps | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadEmojis().then((loaded) => {
      if (!loaded || cancelled) return;

      const list = Object.values(loaded.byId ?? {});
      setEmojiIndex(list);

      setMaps(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return maps;
}
