import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import GitHubIcon from "@mui/icons-material/GitHub";
import ForumIcon from "@mui/icons-material/Forum";

import { APP_VERSION } from "../../utility/version";

import "./HelpDialog.css";
import {
  Button,
  DialogActions,
  Divider,
  Link,
  Typography,
} from "@mui/material";

export enum SavePresetDialogState {
  None,
  NewPreset,
  ExistingPreset,
}

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export const HelpDialog = ({ open, onClose }: HelpDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onClose={onClose} className="help-dialog" maxWidth="xs">
      <form>
        <DialogTitle>About this app</DialogTitle>

        <Divider className="mv-8" />

        <DialogContent>
          <div>
            <Typography variant="h6" className="help-dialog__heading">
              Quick tips
            </Typography>

            <Typography
              variant="body2"
              component="div"
              className="help-dialog__body"
            >
              <ul className="help-dialog__list">
                <li>
                  <strong>Drag-and-drop</strong> — Drag one inventory slot onto
                  another to swap positions.
                </li>
                <li>
                  <strong>Assign multiple</strong> — Hold <i>Shift</i> and click
                  slots to assign the same item to several at once.
                </li>
                <li>
                  <strong>Notes emojis</strong> — Type <i>;emojiName;</i> in
                  note fields to insert emojis.
                </li>
              </ul>
            </Typography>
          </div>

          <div>
            <Typography variant="h6" className="help-dialog__heading">
              Editing
            </Typography>

            <Typography
              variant="body2"
              component="div"
              className="help-dialog__body"
            >
              <ul className="help-dialog__list">
                <li>
                  <strong>Local presets</strong> are editable in your browser.
                </li>
                <li>
                  <strong>Cloud presets</strong> are read-only for most users.
                </li>
                <li>
                  To edit a cloud preset,{" "}
                  <strong>duplicate it via New Preset</strong> or ask a{" "}
                  <strong>PvME Editing Staff</strong> member to update it.
                </li>
              </ul>
            </Typography>
          </div>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", px: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <small>Built with ❤️ by x222</small>
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {APP_VERSION}
          </Typography>
          <Typography
            variant="body2"
            className="help-dialog__body d-flex flex-center"
          >
            <GitHubIcon className="mr-8" />
            <Link
              href="https://github.com/pvme/preset-maker"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
          </Typography>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
