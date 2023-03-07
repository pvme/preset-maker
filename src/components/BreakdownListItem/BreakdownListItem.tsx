import Avatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import React, { useCallback, useState } from "react";
import { ItemData } from "../../types/inventory-slot";

import "./BreakdownListItem.css";

export interface BreakdownListItemProps {
  item: ItemData;
}

const defaultFontSize = 12;

export const BreakdownListItem = ({ item }: BreakdownListItemProps) => {
  const [text, setText] = useState<string>();
  const [fontSize, setFontSize] = useState<number>(defaultFontSize);

  const onChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);

    if (!event.target.value) {
      setFontSize(defaultFontSize);
      return;
    }

    // TODO: update this to be 'better'
    const newFontSize = defaultFontSize - event.target.value.length / 50;
    setFontSize(newFontSize);
  }, []);

  return (
    <ListItem
      tabIndex={-1}
      classes={{
        root: 'breakdown-list-item',
        secondaryAction: 'notes-field-outer-two'
      }}
      secondaryAction={
        <TextField
          tabIndex={1}
          fullWidth
          multiline
          value={text}
          onChange={onChange}
          size="small"
          variant="outlined"
          inputProps={{
            className: "inner-notes-field",
            style: {
              fontSize: fontSize,
            },
          }}
          classes={{
            root: 'notes-field-outer'
          }}
          className="notes-field"
        />
      }
      disablePadding
    >
      <ListItemButton tabIndex={-1}>
        {item.image ? (
          <ListItemAvatar tabIndex={-1}>
            <Avatar
              imgProps={{ style: { objectFit: "scale-down" } }}
              variant="square"
              alt={item.label}
              src={item.image}
            />
          </ListItemAvatar>
        ) : (
          <div style={{ height: "40px" }}></div>
        )}
        <ListItemText tabIndex={-1} primaryTypographyProps={{ maxWidth: "225px" }} primary={item.name} />
      </ListItemButton>
    </ListItem>
  );
};
