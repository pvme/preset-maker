import React, { useCallback } from 'react';

import ContentEditable, { type ContentEditableEvent } from 'react-contenteditable';
import { useDispatch } from 'react-redux';
import sanitizeHtml from 'sanitize-html';
import linkifyHtml from 'linkify-html';

import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import { type ItemData } from '../../types/item-data';
import { setBreakdown } from '../../redux/store/reducers/preset-reducer';
import { type BreakdownType } from '../../types/breakdown';

import './BreakdownListItem.css';
import { emojify } from '../../utility/emojify';

export interface BreakdownListItemProps {
  item: ItemData
  type: BreakdownType
}

const allowedHtmlTags = sanitizeHtml.defaults.allowedTags.concat(['img']);
const allowedHtmlAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  img: ['class', 'src']
};
const transformNotes = (input: string): string => {
  const sanitizedHtml = sanitizeHtml(input, {
    allowedTags: allowedHtmlTags,
    allowedAttributes: allowedHtmlAttributes
  });
  return emojify(sanitizedHtml);
};

export const BreakdownListItem = ({ item, type }: BreakdownListItemProps): JSX.Element => {
  const dispatch = useDispatch();
  const breakdownNotes = item.breakdownNotes ?? '';

  const onChange = useCallback((event: ContentEditableEvent) => {
    if (event.currentTarget.innerHTML === null || event.currentTarget.innerHTML === undefined) {
      return;
    }

    dispatch(
      setBreakdown({
        breakdownType: type,
        itemName: item.label,
        description: transformNotes(event.currentTarget.innerHTML)
      })
    );
  }, [item]);

  const handleRecentClick = useCallback(
    (item: ItemData) => {
      window.open(item.wikiLink, '_blank');
    },
    []
  );

  const onBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.innerHTML === null || event.currentTarget.innerHTML === undefined) {
        return;
      }

      dispatch(
        setBreakdown({
          breakdownType: type,
          itemName: item.label,
          description: transformNotes(event.currentTarget.innerHTML)
        })
      );
    },
    [type, item.label]
  );

  const breakdownNotesWithLinks = linkifyHtml(breakdownNotes, {
    attributes: {
      contenteditable: false
    },
    defaultProtocol: 'https'
  });

  const breakdownNotesWithEmojisAndLinks = breakdownNotesWithLinks;

  return (
    <ListItem
      key={item.name}
      tabIndex={-1}
      classes={{
        root: 'breakdown-list-item',
        secondaryAction: 'notes-field-outer-two'
      }}
      secondaryAction={
        <ContentEditable
          placeholder={item.breakdownNotes}
          className="inner-notes-field"
          html={breakdownNotesWithEmojisAndLinks}
          onChange={onChange}
          onBlur={onBlur}
        />
      }
      disablePadding
    >
      <ListItemButton tabIndex={-1}>
        {(item.image.length > 0)
          ? (
          <ListItemAvatar tabIndex={-1}>
            <Avatar
              imgProps={{ style: { objectFit: 'scale-down' } }}
              variant="square"
              alt={item.label}
              src={item.image}
              title="Click to open wiki page"
              onClick={() => { handleRecentClick(item); }}
            />
          </ListItemAvatar>
            )
          : (
          <div style={{ height: '40px' }}></div>
            )}
        <ListItemText
          tabIndex={-1}
          primaryTypographyProps={{ maxWidth: '225px' }}
          primary={'🔗 ' + item.name}
          title="Click to open wiki page"
          onClick={() => { handleRecentClick(item); }}
        />
      </ListItemButton>
    </ListItem>
  );
};
