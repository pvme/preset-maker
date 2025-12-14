// src/components/PresetBreakdown/PresetBreakdown.tsx

import React, { useEffect, useMemo, useState } from "react";
import List from "@mui/material/List";
import Box from "@mui/material/Box";

import { BreakdownListItem } from "../BreakdownListItem/BreakdownListItem";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectPreset, setBreakdownEntry } from "../../redux/store/reducers/preset-reducer";
import { useEmojiMap } from "../../hooks/useEmojiMap";

import "./PresetBreakdown.css";

type DraftKey = `${"inventory" | "equipment"}-${number}`;

interface Row {
  key: DraftKey;
  itemId: string;
  slotType: "inventory" | "equipment";
  slotIndex: number;
  description: string;
}

export const PresetBreakdown = (): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const preset = useAppSelector(selectPreset);
  const emojiMap = useEmojiMap();

  const [drafts, setDrafts] = useState<Record<DraftKey, string>>({});

  // Sync drafts from Redux
  useEffect(() => {
    const next: Record<DraftKey, string> = {};

    for (const b of preset.breakdown) {
      next[`${b.slotType}-${b.slotIndex}`] = b.description;
    }

    setDrafts(next);
  }, [preset.breakdown]);

  const inventoryRows = useMemo<Row[]>(() => {
    return preset.inventorySlots.flatMap((slot, index) => {
      if (!slot.id) return [];

      const key = `inventory-${index}` as DraftKey;

      return [
        {
          key,
          itemId: slot.id,
          slotType: "inventory",
          slotIndex: index,
          description: drafts[key] ?? "",
        },
      ];
    });
  }, [preset.inventorySlots, drafts]);

  const equipmentRows = useMemo<Row[]>(() => {
    return preset.equipmentSlots.flatMap((slot, index) => {
      if (!slot.id) return [];

      const key = `equipment-${index}` as DraftKey;

      return [
        {
          key,
          itemId: slot.id,
          slotType: "equipment",
          slotIndex: index,
          description: drafts[key] ?? "",
        },
      ];
    });
  }, [preset.equipmentSlots, drafts]);

  const commit = (
    slotType: "inventory" | "equipment",
    slotIndex: number,
    description: string
  ) => {
    dispatch(
      setBreakdownEntry({
        slotType,
        slotIndex,
        description,
      })
    );
  };

  if (!emojiMap) return null;

  return (
    <Box className="breakdown-container">
      <div className="breakdown-table-header">
        <div className="breakdown-col-header">Inventory</div>
        <div className="breakdown-col-header">Equipment</div>
      </div>

      <div className="breakdown-grid">
        <List className="breakdown-list">
          {inventoryRows.map((row) => (
            <BreakdownListItem
              key={row.key}
              emojiMap={emojiMap}
              itemId={row.itemId}
              description={row.description}
              onCommit={(desc) =>
                commit(row.slotType, row.slotIndex, desc)
              }
            />
          ))}
        </List>

        <List className="breakdown-list">
          {equipmentRows.map((row) => (
            <BreakdownListItem
              key={row.key}
              emojiMap={emojiMap}
              itemId={row.itemId}
              description={row.description}
              onCommit={(desc) =>
                commit(row.slotType, row.slotIndex, desc)
              }
            />
          ))}
        </List>
      </div>
    </Box>
  );
};
