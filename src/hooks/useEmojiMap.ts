import { useEffect, useState } from 'react'

import sortedItems from '../data/sorted_items.json'
import sortedRelics from '../data/sorted_relics.json'
import sortedFamiliars from '../data/sorted_familiars.json'

type EmojiMap = Record<string, string>

function mergeEmojiSources(...sources: any[]): EmojiMap {
  const result: EmojiMap = {}
  for (const list of sources) {
    for (const entry of list) {
      if (entry.name && entry.image) {
        result[entry.name.toLowerCase()] = entry.image
      }
    }
  }
  return result
}

const fullEmojiMap: EmojiMap = mergeEmojiSources(
  sortedItems,
  sortedRelics,
  sortedFamiliars
)

export function useEmojiMap() {
  const [emojiMap] = useState<EmojiMap>(fullEmojiMap)

  function getEmojiUrl(name: string): string | undefined {
    return emojiMap[name.toLowerCase()]
  }

  return { emojiMap, getEmojiUrl }
}
