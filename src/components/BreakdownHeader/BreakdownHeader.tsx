import React from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

export const BreakdownHeader = (): JSX.Element => {
  return (
    <ListItem disablePadding>
      <ListItemButton
        style={{
          textAlign: 'center'
        }}
      >
        <ListItemText
          primaryTypographyProps={{
            style: { fontWeight: 'bold' }
          }}
          primary="Name"
        />
        <ListItemText
          primaryTypographyProps={{
            style: { fontWeight: 'bold' }
          }}
          primary="Notes"
        />
      </ListItemButton>
    </ListItem>
  );
};
