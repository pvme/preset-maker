// src/components/EmojiSelectDialog/EmojiSelectDialog.tsx

import React, { useCallback, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Button,
  Avatar,
  Typography,
  Tooltip,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import { useEmojiMap } from "../../hooks/useEmojiMap";
import { useEmojiFilter } from "./useEmojiFilter";
import { SlotType } from "../../schemas/slot-type";

import "./EmojiSelectDialog.css";

export interface EmojiSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (ids: string[]) => void;

  slotType: SlotType | "relic" | "familiar";
  slotIndex: number;
  slotKey: string;
  selectedIndices: string[];
  recentlySelected: { id: string }[];
}

export const EmojiSelectDialog = (props: EmojiSelectDialogProps): JSX.Element => {
  const {
    open,
    onClose,
    onSelect,
    slotType,
    slotIndex,
    slotKey,
    selectedIndices,
    recentlySelected,
  } = props;

  const maps = useEmojiMap();
  const [expanded, setExpanded] = useState(false);

  const filter = useEmojiFilter({
    maps,
    slotType,
    slotIndex,
    slotKey,
    selectedIndices,
  });

  const { ready, options, filterOptions, filterRecent, dialogTitle } = filter;

  const onChange = useCallback(
    (_event: unknown, value: { id: string } | null) => {
      if (value) onSelect([value.id]);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!ready || !maps) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Loading…</DialogTitle>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: "dialog__paper" }}
      className={expanded ? "dialog--expanded" : "dialog--collapsed"}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>

      <DialogContent className="dialog__content">
        <Autocomplete
          disablePortal
          autoHighlight
          options={options}
          onChange={onChange}
          filterOptions={filterOptions}
          onOpen={() => setExpanded(true)}
          onClose={() => setExpanded(false)}
          getOptionLabel={(o) => maps.get(o.id)?.name ?? ""}
          renderInput={(params) => (
            <TextField {...params} autoFocus label="Search…" />
          )}
          renderOption={(props, option) => {
            const entry = maps.get(option.id);
            if (!entry) return null;

            const url = maps.getUrl(entry.id) ?? undefined;
            const { key, ...safeProps } = props as any;

            return (
              <Box
                component="li"
                key={entry.id}
                {...safeProps}
                className="dialog__option"
              >
                {url && (
                  <img
                    src={url}
                    alt={entry.name}
                    className="dialog__list__image"
                  />
                )}
                {entry.name}
              </Box>
            );
          }}
        />

        {recentlySelected.length > 0 && (
          <div className="recent-items-title">
            <Typography>Recent</Typography>

            {recentlySelected
              .filter((i) => filterRecent(i.id))
              .map((item) => {
                const entry = maps.get(item.id);
                if (!entry) return null;

                return (
                  <Tooltip key={entry.id} title={entry.name}>
                    <Button
                      className="recent-item-button"
                      startIcon={
                        <Avatar
                          variant="square"
                          src={maps.getUrl(entry.id) ?? undefined}
                          className="recent-item-image"
                        />
                      }
                      onClick={() => {
                        onSelect([entry.id]);
                        onClose();
                      }}
                    />
                  </Tooltip>
                );
              })}
          </div>
        )}
      </DialogContent>

      <DialogActions className="dialog__actions">
        <Button
          color="warning"
          onClick={() => {
            onSelect([""]);
            onClose();
          }}
        >
          Clear slot
        </Button>

        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
