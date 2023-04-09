import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface ResetConfirmationProps {
  handleConfirmation: () => void
  handleClose: () => void
  open: boolean
}

export const ResetConfirmationDialog = ({
  handleConfirmation,
  handleClose,
  open
}: ResetConfirmationProps): JSX.Element => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Are you really really sure you wish to reset the entire preset?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          This will also reset all of the breakdown notes, and cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          Cancel
        </Button>
        <Button onClick={handleConfirmation}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
};
