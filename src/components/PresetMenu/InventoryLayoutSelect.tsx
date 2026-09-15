import { MenuItem, TextField } from "@mui/material";
import { type InventoryLayout } from "../../hooks/useInventoryLayout";

export function InventoryLayoutSelect({ layout, onChange }: {
  layout: InventoryLayout;
  onChange: (layout: InventoryLayout) => void;
}) {
  return (
    <TextField select size="small" label="Inventory layout" value={layout}
      className="preset-menu__layout"
      onChange={(event) => onChange(event.target.value as InventoryLayout)}>
      <MenuItem value="7x4">7 columns × 4 rows</MenuItem>
      <MenuItem value="4x7">4 columns × 7 rows</MenuItem>
    </TextField>
  );
}
