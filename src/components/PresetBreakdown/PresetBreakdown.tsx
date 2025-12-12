// src/components/PresetBreakdown/PresetBreakdown.tsx

import React from "react";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";

import { BreakdownListItem } from "../BreakdownListItem/BreakdownListItem";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectPreset, setBreakdownEntry } from "../../redux/store/reducers/preset-reducer";

import "./PresetBreakdown.css";

//
// INLINE BREAKDOWN HEADER
//
const BreakdownHeader = ({ title }: { title?: string }) => (
  <ListItem disablePadding className="desktop-only">
    <ListItemButton style={{ textAlign: "center" }}>
      <ListItemText
        primaryTypographyProps={{ style: { fontWeight: "bold" } }}
        primary={title ?? "Item"}
      />
      <ListItemText
        primaryTypographyProps={{ style: { fontWeight: "bold" } }}
        primary="Notes"
      />
    </ListItemButton>
  </ListItem>
);

export const PresetBreakdown = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const preset = useAppSelector(selectPreset);

  //
  // INVENTORY ROWS
  //
  const inventoryRows = preset.inventorySlots
    .map((slot, index) => {
      if (!slot.id) return null;
      const breakdown = preset.breakdown.find(
        (b) => b.slotType === "inventory" && b.slotIndex === index
      );

      return {
        slotType: "inventory" as const,
        slotIndex: index,
        itemId: slot.id,
        description: breakdown?.description ?? "",
      };
    })
    .filter(Boolean) as {
    slotType: "inventory";
    slotIndex: number;
    itemId: string;
    description: string;
  }[];

  //
  // EQUIPMENT ROWS
  //
  const equipmentRows = preset.equipmentSlots
    .map((slot, index) => {
      if (!slot.id) return null;
      const breakdown = preset.breakdown.find(
        (b) => b.slotType === "equipment" && b.slotIndex === index
      );

      return {
        slotType: "equipment" as const,
        slotIndex: index,
        itemId: slot.id,
        description: breakdown?.description ?? "",
      };
    })
    .filter(Boolean) as {
    slotType: "equipment";
    slotIndex: number;
    itemId: string;
    description: string;
  }[];

  return (
    <Box className="breakdown-container">
      {/* Column headers */}
      <div className="breakdown-table-header">
        <div className="breakdown-col-header">Inventory</div>
        <div className="breakdown-col-header">Equipment</div>
      </div>

      {/* Two-column grid */}
      <div className="breakdown-grid">
        {/* Inventory list */}
        <List className="breakdown-list">
          {inventoryRows.map((row) => (
            <BreakdownListItem
              key={`inv-${row.slotIndex}`}
              entry={{
                slotType: "inventory",
                slotIndex: row.slotIndex,
                description: row.description,
              }}
              itemId={row.itemId}
              onChange={(description) =>
                dispatch(
                  setBreakdownEntry({
                    slotType: "inventory",
                    slotIndex: row.slotIndex,
                    description,
                  })
                )
              }
            />
          ))}
        </List>

        {/* Equipment list */}
        <List className="breakdown-list">
          {equipmentRows.map((row) => (
            <BreakdownListItem
              key={`eq-${row.slotIndex}`}
              entry={{
                slotType: "equipment",
                slotIndex: row.slotIndex,
                description: row.description,
              }}
              itemId={row.itemId}
              onChange={(description) =>
                dispatch(
                  setBreakdownEntry({
                    slotType: "equipment",
                    slotIndex: row.slotIndex,
                    description,
                  })
                )
              }
            />
          ))}
        </List>
      </div>
    </Box>
  );
};
