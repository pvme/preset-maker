import { Tooltip } from "@mui/material"

export const ClipboardCopyButtonContainer = ({ className, children }: { className: string, children: JSX.Element }) => {
  return (
    <Tooltip
      className={className}
      title="Copy Image to Clipboard functionality is only available in Chrome, Edge, Safari, and Opera. If using Firefox, you can set `dom.events.asyncClipboard.clipboardItem` to `true`."
    >
      <span>
        {children}
      </span>
    </Tooltip>
  );
};
