import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

interface ItemSlotContextMenuProps {
  anchorPosition: { top: number; left: number } | null;
  handleClose: () => void;
}

export const ItemSlotContextMenu = ({
  anchorPosition,
  handleClose,
}: ItemSlotContextMenuProps) => {
  return (
    <Menu
      anchorReference="anchorPosition"
      anchorPosition={{ ...(anchorPosition ?? { top: 0, left: 0 }) }}
      open={Boolean(anchorPosition)}
      onClose={handleClose}
      onContextMenu={(event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <MenuItem onClick={handleClose}>Add an alternate item #1</MenuItem>
      <MenuItem onClick={handleClose}>Add an alternate item #2</MenuItem>
    </Menu>
  );
};
