import React, { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import { setBreakdown } from '../../redux/store/reducers/preset-reducer';
import { type BreakdownType } from '../../schemas/breakdown';
import { type Item as ItemData } from '../../schemas/item-data';

import { NotesField } from '../NotesField/NotesField';
import './BreakdownListItem.css';

export interface BreakdownListItemProps {
  item: ItemData
  type: BreakdownType
}

export const BreakdownListItem = ({ item, type }: BreakdownListItemProps): JSX.Element => {
  const dispatch = useDispatch();

  const handleRecentClick = useCallback(
    (item: ItemData) => {
      window.open(item.wikiLink, '_blank');
    },
    []
  );

  const onNotesBlur = useCallback(
    (formattedNotes: string) => {
      dispatch(
        setBreakdown({
          breakdownType: type,
          itemName: item.label,
          description: formattedNotes
        })
      );
    },
    [type, item.label]
  );

  return (
    <ListItem
      key={item.name}
      tabIndex={-1}
      classes={{
        root: 'breakdown-list-item',
        secondaryAction: 'notes-field-outer-two'
      }}
      secondaryAction={
        <NotesField
          placeholder={item.breakdownNotes}
          className="inner-notes-field"
          initialValue={item.breakdownNotes}
          onBlur={onNotesBlur}
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
