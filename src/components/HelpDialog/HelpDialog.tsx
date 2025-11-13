
import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import GitHubIcon from '@mui/icons-material/GitHub';
import ForumIcon from '@mui/icons-material/Forum';

import { APP_VERSION } from '../../utility/version';

import './HelpDialog.css';
import { Button, DialogActions, Divider, Link, Typography } from '@mui/material';

export enum SavePresetDialogState {
  None,
  NewPreset,
  ExistingPreset,
}

interface HelpDialogProps {
  open: boolean
  onClose: () => void
}

export const HelpDialog = ({
  open,
  onClose
}: HelpDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onClose={onClose} className="help-dialog" maxWidth="xs">
      <form>
        <DialogTitle>Help</DialogTitle>
        <DialogContent>
          <div>
            <Typography variant="h6" className="help-dialog__heading">Features</Typography>
            <Typography variant="body2" className="help-dialog__body">
              <ul className="help-dialog__list">
                <li>
                  <strong>Drag-and-drop</strong> - Drag and drop an inventory slot onto another to swap their positions.
                </li>
                <li>
                  <strong>Assign multiple</strong> - Hold <i>Shift+Click</i> to assign multiple slots to the same item.
                </li>
                <li>
                  <strong>Emojis</strong> - Type <i>;emojiName;</i> to use emojis in notes fields.
                </li>
              </ul>
            </Typography>
          </div>
          <Divider className="mv-8" />
          <div>
            <Typography variant="h6" className="help-dialog__heading">Support</Typography>
            <Typography variant="body2" className="help-dialog__body d-flex flex-center">
              <ForumIcon className="mr-8"/>
              <Link className="mr-8" href="https://discord.com/channels/534508796639182860/1020853673317908500">
                Suggestions
              </Link>
              <Divider className="mh-8" orientation="vertical" flexItem />
              <GitHubIcon className="mr-8"/>
              <Link href="https://github.com/pvme/preset-maker">
                GitHub
              </Link>
            </Typography>
          </div>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 2 }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            v{APP_VERSION}
          </Typography>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
