import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { createPresetManualLayout, type ManualLayout } from "../../imageImport/manualLayout.mjs";

const geometry = createPresetManualLayout();
export function ManualControls({ value, onChange }: { value: ManualLayout; onChange: (next: ManualLayout) => void }) {
  const panel = value[value.step], inventory = value.step === "inventory";
  return <Stack spacing={1.5}>
    <Stack direction="row" spacing={1}>
      <Button variant={inventory ? "contained" : "outlined"} onClick={() => onChange({ ...value, step: "inventory" })}>1. Inventory</Button>
      <Button variant={!inventory ? "contained" : "outlined"} disabled={value.inventory.enabled && !value.inventory.box}
        onClick={() => onChange({ ...value, step: "equipment" })}>2. Equipment</Button>
    </Stack>
    <FormControlLabel label={inventory ? "Include inventory" : "Include equipment"} control={<Checkbox checked={panel.enabled}
      onChange={event => onChange({ ...value, [value.step]: { ...panel, enabled: event.target.checked } })} />} />
    {panel.enabled && <>
      {!inventory && <TextField select size="small" label="Equipment arrangement" value={value.equipment.kind}
        onChange={event => onChange({ ...value, equipment: { ...value.equipment, kind: event.target.value as "worn" | "grid", overrides: {} } })}>
        <MenuItem value="worn">Worn equipment</MenuItem><MenuItem value="grid">Grid</MenuItem>
      </TextField>}
      {(inventory || value.equipment.kind === "grid") && <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
        {([['columns', 'Columns'], ['rows', 'Rows'], ['gap', 'Gap (px)']] as const).map(([field, label]) =>
          <TextField key={field} size="small" type="number" label={label} value={panel[field]} inputProps={{ min: field === "gap" ? 0 : 1, max: field === "gap" ? 40 : inventory ? 28 : 12 }}
            onChange={event => onChange(geometry.grid(value, field, Number(event.target.value)))} />)}
      </Box>}
      <Typography variant="body2" color="text.secondary">{inventory
        ? `Drag around the inventory, then continue to equipment. The first 28 cells are read across each row (${panel.columns} columns, ${panel.rows} rows).`
        : "Drag around the equipment. You can then drag individual slot boxes to rearrange them. Uncheck Include equipment for an inventory-only image."}</Typography>
    </>}
  </Stack>;
}
