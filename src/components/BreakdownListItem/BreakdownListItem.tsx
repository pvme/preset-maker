import React from "react";
import ListItem from "@mui/material/ListItem";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import ContentEditable from "react-contenteditable";

import { useEmojiEditableField } from "../../hooks/useEmojiEditableField";
import { type EmojiMaps } from "../../hooks/useEmojiMap";

interface Props {
  emojiMap: EmojiMaps;
  description: string;
  itemId: string;
  onCommit: (description: string) => void;
}

export const BreakdownListItem = ({
  emojiMap,
  description,
  itemId,
  onCommit,
}: Props): JSX.Element | null => {
  const field = useEmojiEditableField({
    value: description,
    allowMultiline: true,
    onCommit,
  });

  const emoji = emojiMap.get(itemId);
  if (!emoji) return null;

  const imageUrl = emojiMap.getUrl(itemId);
  const wikiName = emoji.name.replace(/ /g, "_");
  const wikiUrl = `https://runescape.wiki/w/${encodeURIComponent(wikiName)}`;

  return (
    <ListItem className="breakdown-list-item">
      <Box
        className="breakdown-item-left"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        {imageUrl && <div className="breakdown-image-wrapper"><img src={imageUrl} alt={emoji.name} width={38} /></div>}

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

      <Box className="breakdown-description-wrapper">
        <ContentEditable
          innerRef={field.ref}
          html={field.html}
          className="breakdown-description-editable"
          onFocus={field.onFocus}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      </Box>
    </ListItem>
  );
};
