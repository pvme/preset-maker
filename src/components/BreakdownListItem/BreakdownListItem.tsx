// src/components/BreakdownListItem/BreakdownListItem.tsx

import React from "react";
import ListItem from "@mui/material/ListItem";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";

import { useEmojiMap } from "../../hooks/useEmojiMap";
import { type BreakdownEntry } from "../../schemas/breakdown";

interface Props {
  entry: BreakdownEntry;
  itemId: string;
  onChange: (description: string) => void;
}

export const BreakdownListItem = ({
  entry,
  itemId,
  onChange
}: Props): JSX.Element | null => {
  const maps = useEmojiMap();

  // Still loading?
  if (!maps) return null;

  const emoji = maps.get(itemId);
  if (!emoji) return null;

  const imageUrl = maps.getUrl(itemId);

  // Construct wiki link from emoji name
  const wikiName = emoji.name.replace(/ /g, "_");
  const wikiUrl = `https://runescape.wiki/w/${encodeURIComponent(wikiName)}`;

  return (
    <ListItem className="breakdown-list-item">
      <Box
        className="breakdown-item-left"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        {imageUrl && (
          <img src={imageUrl} alt={emoji.name} width={38} />
        )}

        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <span>{emoji.name}</span>
          <Link
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontSize: "0.75rem", opacity: 0.8 }}
          >
            Open on Wiki
          </Link>
        </Box>
      </Box>

      <TextField
        value={entry.description}
        fullWidth
        size="small"
        onChange={(e) => onChange(e.target.value)}
      />
    </ListItem>
  );
};
