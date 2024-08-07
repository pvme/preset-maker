import React from 'react';
import { List, ListItem } from '@mui/material';
import './Tips.css';

export const Tips = (): JSX.Element => {
  return (
    <fieldset className="tips">
      <legend>Tips</legend>
      <List
        sx={{
          listStyleType: 'disc',
          listStylePosition: 'inside'
        }}
        disablePadding
      >
        <ListItem disablePadding sx={{ display: 'list-item' }}>
          Hover items to see details.
        </ListItem>
      </List>
    </fieldset>
  );
};
