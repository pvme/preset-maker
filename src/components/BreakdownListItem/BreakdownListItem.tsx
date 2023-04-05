import { useCallback, useRef } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useDispatch } from "react-redux";
import sanitizeHtml from "sanitize-html";

import Avatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

import { ItemData } from "../../types/item-data";
import { setBreakdown } from "../../redux/store/reducers/preset-reducer";
import { BreakdownType } from "../../types/breakdown";

import "./BreakdownListItem.css";

export interface BreakdownListItemProps {
  item: ItemData;
  type: BreakdownType;
}

export const BreakdownListItem = ({ item, type }: BreakdownListItemProps) => {
  const dispatch = useDispatch();
  const breakdownNotes = useRef(item.breakdownNotes ?? "");

  const onChange = useCallback((event: ContentEditableEvent) => {
    breakdownNotes.current = sanitizeHtml(event.currentTarget.innerHTML || "");
  }, []);

  const handleRecentClick = useCallback(
    (item: ItemData) => {
      window.open(item.wikiLink, '_blank');
    },
    []
  );

  const onBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      dispatch(
        setBreakdown({
          breakdownType: type,
          itemName: item.label,
          description: sanitizeHtml(event.currentTarget.innerHTML || ""),
        })
      );
    },
    [item]
  );

  return (
    <ListItem
      tabIndex={-1}
      classes={{
        root: "breakdown-list-item",
        secondaryAction: "notes-field-outer-two",
      }}
      secondaryAction={
        <ContentEditable
          placeholder={item.breakdownNotes}
          className="inner-notes-field"
          html={breakdownNotes.current}
          onChange={onChange}
          onBlur={onBlur}
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
              title="Click to open wiki page"
              onClick={() => handleRecentClick(item)}
            />
          </ListItemAvatar>
        ) : (
          <div style={{ height: "40px" }}></div>
        )}
        <ListItemText
          tabIndex={-1}
          primaryTypographyProps={{ maxWidth: "225px" }}
          primary={"🔗 "+ item.name}
          title="Click to open wiki page"
          onClick={() => handleRecentClick(item)}
        />
      </ListItemButton>
    </ListItem>
  );
};
