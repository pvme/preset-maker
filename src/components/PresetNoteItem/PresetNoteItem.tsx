import React from "react";
import ListItem from "@mui/material/ListItem";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import ContentEditable, {
  type ContentEditableEvent,
} from "react-contenteditable";

import { useEmojiEditableField } from "../../hooks/useEmojiEditableField";
import { type EmojiMaps } from "../../hooks/useEmojiMap";

interface Props {
  emojiMap: EmojiMaps;
  description: string;
  itemId: string;
  isEditable: boolean;
  onCommit: (description: string) => void;
}

const noopContentEditableChange = (_event: ContentEditableEvent) => {};
const noopFocus: React.FocusEventHandler<HTMLElement> = () => {};
const noopBlur: React.FocusEventHandler<HTMLElement> = () => {};

export const PresetNoteItem = ({
  emojiMap,
  description,
  itemId,
  isEditable,
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
  const cleanName = emoji.name
    .replace(/\s*\(stack(?: of [\d,]+)?\)$/i, "")
    .trim();

  const wikiName = cleanName.replace(/ /g, "_");
  const wikiUrl = `https://runescape.wiki/w/${encodeURIComponent(wikiName)}`;

  return (
    <ListItem className="preset-notes__item">
      <Box className="preset-notes__item-meta">
        {imageUrl && (
          <div className="preset-notes__item-media">
            <img src={imageUrl} alt={emoji.name} width={38} />
          </div>
        )}

        <Box className="preset-notes__item-text">
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

      <Box className="preset-notes__item-body">
        <ContentEditable
          innerRef={field.ref}
          html={field.html}
          className={[
            "preset-notes__editor",
            !isEditable ? "preset-notes__editor--readonly" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onFocus={
            isEditable
              ? (field.onFocus as React.FocusEventHandler<HTMLElement>)
              : noopFocus
          }
          onChange={
            isEditable
              ? (field.onChange as (event: ContentEditableEvent) => void)
              : noopContentEditableChange
          }
          onBlur={
            isEditable
              ? (field.onBlur as React.FocusEventHandler<HTMLElement>)
              : noopBlur
          }
          disabled={!isEditable}
        />
      </Box>
    </ListItem>
  );
};
