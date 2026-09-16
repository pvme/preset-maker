import { MenuItem, Switch, Typography } from "@mui/material";
import { type InventoryLayout } from "../../hooks/useInventoryLayout";

export function InventoryLayoutSelect({ layout, onChange }: {
  layout: InventoryLayout;
  onChange: (layout: InventoryLayout) => void;
}) {
  const isPortrait = layout === "4x7";
  return (
    <MenuItem
      className="preset-menu__layout"
      onClick={() => onChange(isPortrait ? "7x4" : "4x7")}
    >
      <Typography>Layout</Typography>
      <span className="preset-menu__layout-switch">
        <span>Landscape</span>
        <Switch
          checked={isPortrait}
          onClick={(event) => event.stopPropagation()}
          onChange={(_event, checked) => onChange(checked ? "4x7" : "7x4")}
          inputProps={{ "aria-label": "Portrait layout" }}
        />
        <span>Portrait</span>
      </span>
    </MenuItem>
  );
}
