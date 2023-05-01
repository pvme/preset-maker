import React from 'react';
import { Tooltip } from '@mui/material';
import { canCopyImagesToClipboard } from 'copy-image-clipboard';

const warningMsg =
  'Copy Image to Clipboard functionality is only available in Chrome, Edge, Safari, and Opera. ' +
  'If using Firefox, you can set `dom.events.asyncClipboard.clipboardItem` to`true` in about: config.';

export const ClipboardCopyButtonContainer = ({ className, children }: { className?: string, children: JSX.Element }): JSX.Element => {
  const title = canCopyImagesToClipboard()
    ? undefined
    : warningMsg;
  return (
    <Tooltip className={className} title={title}>
      <span>{children}</span>
    </Tooltip>
  );
};
