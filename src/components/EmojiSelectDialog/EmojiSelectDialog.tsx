// src/components/EmojiSelectDialog/EmojiSelectDialog.tsx

import React, { useCallback, useState, useRef } from "react";
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
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import { useEmojiMap } from "../../hooks/useEmojiMap";
import { useEmojiFilter } from "./useEmojiFilter";
import { SlotType } from "../../schemas/slot-type";

import "./EmojiSelectDialog.css";

const MIN_QUERY_LENGTH = 2;

export interface EmojiSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (ids: string[]) => void;

  slotType: SlotType | "relic" | "familiar";
  slotIndex: number;
  slotKey: string;
  selectedIndices: string[];
  recentlySelected: { id: string }[];

  multiFill?: boolean;
  onToggleMultiFill?: (value: boolean) => void;
}

export const EmojiSelectDialog = (
  props: EmojiSelectDialogProps,
): JSX.Element => {
  const {
    open,
    onClose,
    onSelect,
    slotType,
    slotIndex,
    slotKey,
    selectedIndices,
    recentlySelected,
    multiFill = false,
    onToggleMultiFill,
  } = props;

  const maps = useEmojiMap();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [listOpen, setListOpen] = useState(false);

  const filter = useEmojiFilter({
    maps,
    slotType,
    slotIndex,
    slotKey,
    selectedIndices,
  });

  const { ready, options, filterOptions, filterRecent, dialogTitle } = filter;

  const canSearch = inputValue.length >= MIN_QUERY_LENGTH;
  const isReady = ready && maps;

  const handleSelect = useCallback(
    (id: string) => {
      requestAnimationFrame(() => {
        onSelect([id]);

        if (multiFill) {
          setInputValue("");
          setListOpen(false);
        } else {
          onClose();
        }
      });
    },
    [onSelect, onClose, multiFill],
  );

  const onChange = useCallback(
    (_event: unknown, value: { id: string } | null) => {
      if (value) handleSelect(value.id);
    },
    [handleSelect],
  );

  const renderOption = useCallback(
    (props: React.HTMLAttributes<HTMLLIElement>, option: { id: string }) => {
      if (!maps) return null;

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
              loading="lazy"
              decoding="async"
            />
          )}
          {entry.name}
        </Box>
      );
    },
    [maps],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: "dialog__paper" }}
      className={expanded ? "dialog--expanded" : "dialog--collapsed"}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>

      <DialogContent className="dialog__content">
        {!isReady ? (
          <Typography>Loading…</Typography>
        ) : (
          <div className="dialog__layout">
            {/* SEARCH */}
            <div className="dialog__search">
              <Autocomplete
                value={null}
                disablePortal
                autoHighlight
                filterSelectedOptions
                disableListWrap
                options={canSearch ? options : []}
                onChange={onChange}
                filterOptions={filterOptions}
                inputValue={inputValue}
                onInputChange={(_, value) => setInputValue(value)}
                open={listOpen && canSearch}
                onOpen={() => setListOpen(true)}
                onClose={(_, reason) => {
                  if (reason === "escape") {
                    setListOpen(false);
                    return;
                  }
                  setListOpen(false);
                }}
                noOptionsText={`Type ${MIN_QUERY_LENGTH}+ characters`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                getOptionLabel={(o) => maps?.get(o.id)?.name ?? ""}
                renderOption={renderOption}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={inputRef}
                    autoFocus
                    placeholder="Search…"
                    onFocus={() => {
                      setExpanded(true);
                      if (canSearch) setListOpen(true);
                    }}
                    onBlur={() => setExpanded(false)}
                    helperText={
                      !canSearch
                        ? `Type at least ${MIN_QUERY_LENGTH}+ characters`
                        : undefined
                    }
                  />
                )}
              />
            </div>

            {/* OPTIONS */}
            {onToggleMultiFill && (
              <div className="dialog__options">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={multiFill}
                      onChange={(e) =>
                        onToggleMultiFill(e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label="Go to next slot once chosen"
                />
              </div>
            )}

            {/* RECENT */}
            {recentlySelected.length > 0 && (
              <>

                <div className="dialog__recent">
                  <Typography
                    variant="caption"
                    className="dialog__recent-title"
                  >
                    RECENT
                  </Typography>

                  <div className="dialog__recent-grid">
                    {recentlySelected
                      .filter((i) => filterRecent(i.id))
                      .map((item) => {
                        const entry = maps?.get(item.id);
                        if (!entry) return null;

                        return (
                          <Tooltip key={entry.id} title={entry.name}>
                            <Button
                              className="recent-item-button"
                              startIcon={
                                <Avatar
                                  variant="square"
                                  src={maps?.getUrl(entry.id) ?? undefined}
                                  className="recent-item-image"
                                />
                              }
                              onClick={() => handleSelect(entry.id)}
                            />
                          </Tooltip>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>

      <DialogActions className="dialog__actions">
        <Button
          color="warning"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setListOpen(false);
            inputRef.current?.blur();
            onSelect([""]);
            onClose();
          }}
        >
          Clear slot
        </Button>

        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
