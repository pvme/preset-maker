// src/components/PresetNotes/PresetNotes.tsx

import React, { useEffect, useMemo, useState } from "react";
import List from "@mui/material/List";
import Box from "@mui/material/Box";

import { PresetNoteItem } from "../PresetNoteItem/PresetNoteItem";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectPreset,
  setBreakdownEntry,
} from "../../redux/store/reducers/preset-reducer";
import { useEmojiMap } from "../../hooks/useEmojiMap";
import { useStorageMode } from "../../storage/StorageModeContext";

import "./PresetNotes.css";

type DraftKey = `${"inventory" | "equipment"}-${number}`;

interface NoteRow {
  key: DraftKey;
  itemId: string;
  eofSpec?: string;
  slotType: "inventory" | "equipment";
  slotIndex: number;
  description: string;
}

const hasNotes = (value: string | undefined | null) => !!value?.trim().length;

export const PresetNotes = (): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const preset = useAppSelector(selectPreset);
  const emojiMap = useEmojiMap();
  const { isPresetEditable } = useStorageMode();

  const [drafts, setDrafts] = useState<Record<DraftKey, string>>({});

  useEffect(() => {
    const next: Record<DraftKey, string> = {};

    for (const b of preset.breakdown) {
      next[`${b.slotType}-${b.slotIndex}`] = b.description;
    }

    setDrafts(next);
  }, [preset.breakdown]);

  const inventoryNotes = useMemo<NoteRow[]>(() => {
    return preset.inventorySlots.flatMap((slot, index) => {
      if (!slot.id) return [];

      const key = `inventory-${index}` as DraftKey;
      const description = drafts[key] ?? "";

      if (!isPresetEditable && !hasNotes(description)) return [];

      return [
        {
          key,
          itemId: slot.id,
          eofSpec: slot.eof_spec,
          slotType: "inventory",
          slotIndex: index,
          description,
        },
      ];
    });
  }, [preset.inventorySlots, drafts, isPresetEditable]);

  const equipmentNotes = useMemo<NoteRow[]>(() => {
    return preset.equipmentSlots.flatMap((slot, index) => {
      if (!slot.id) return [];

      const key = `equipment-${index}` as DraftKey;
      const description = drafts[key] ?? "";

      if (!isPresetEditable && !hasNotes(description)) return [];

      return [
        {
          key,
          itemId: slot.id,
          eofSpec: slot.eof_spec,
          slotType: "equipment",
          slotIndex: index,
          description,
        },
      ];
    });
  }, [preset.equipmentSlots, drafts, isPresetEditable]);

  const hasAnySlotNotes = useMemo(() => {
    return preset.breakdown.some((entry) => hasNotes(entry.description));
  }, [preset.breakdown]);

  const showInventoryNotes = isPresetEditable || inventoryNotes.length > 0;
  const showEquipmentNotes = isPresetEditable || equipmentNotes.length > 0;
  const visibleColumnCount =
    Number(showInventoryNotes) + Number(showEquipmentNotes);

  const commit = (
    slotType: "inventory" | "equipment",
    slotIndex: number,
    description: string,
  ) => {
    dispatch(
      setBreakdownEntry({
        slotType,
        slotIndex,
        description,
      }),
    );
  };

  if (!emojiMap || !hasAnySlotNotes) return null;
  if (visibleColumnCount === 0) return null;

  return (
    <Box className="preset-notes">
      <div
        className={`preset-notes__header${
          visibleColumnCount === 1 ? " preset-notes__header--single" : ""
        }`}
      >
        {showInventoryNotes && (
          <div className="preset-notes__column-title">Inventory Notes</div>
        )}
        {showEquipmentNotes && (
          <div className="preset-notes__column-title">Equipment Notes</div>
        )}
      </div>

      <div
        className={`preset-notes__grid${
          visibleColumnCount === 1 ? " preset-notes__grid--single" : ""
        }`}
      >
        {showInventoryNotes && (
          <div className="preset-notes__column">
            <div className="preset-notes__column-title preset-notes__column-title--mobile">
              Inventory Notes
            </div>

            <List className="preset-notes__list">
              {inventoryNotes.map((row) => (
                <PresetNoteItem
                  key={row.key}
                  emojiMap={emojiMap}
                  itemId={row.itemId}
                  eofSpec={row.eofSpec}
                  description={row.description}
                  isEditable={isPresetEditable}
                  onCommit={(desc) => commit(row.slotType, row.slotIndex, desc)}
                />
              ))}
            </List>
          </div>
        )}

        {showEquipmentNotes && (
          <div className="preset-notes__column">
            <div className="preset-notes__column-title preset-notes__column-title--mobile">
              Equipment Notes
            </div>

            <List className="preset-notes__list">
              {equipmentNotes.map((row) => (
                <PresetNoteItem
                  key={row.key}
                  emojiMap={emojiMap}
                  itemId={row.itemId}
                  eofSpec={row.eofSpec}
                  description={row.description}
                  isEditable={isPresetEditable}
                  onCommit={(desc) => commit(row.slotType, row.slotIndex, desc)}
                />
              ))}
            </List>
          </div>
        )}
      </div>
    </Box>
  );
};
