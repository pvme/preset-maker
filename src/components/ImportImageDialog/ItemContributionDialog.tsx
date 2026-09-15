import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { createPresetIconContribution, type Challenge, type ContributionConfig, type ContributionIcon } from "../../imageImport/iconContribution.mjs";
import type { Match } from "../../imageImport/recognition";
import { UI_TO_PRESET_SLOT } from "../PresetEditor/equipmentSlots";
import { slotLabel } from "./MatchReview";

const client = createPresetIconContribution(import.meta.env.BASE_URL + "icon-cleanup");
const endpoint = import.meta.env.VITE_ITEM_CONTRIBUTION_URL || "";
const slots = ["Inventory", "Head", "Body", "Legs", "Main hand", "Off hand", "Hands", "Feet", "Aura", "Ammo", "Neck", "Ring", "Cape", "Pocket"];

export function ItemContributionDialog({ match, onClose }: { match: Match; onClose: () => void }) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [aliases, setAliases] = useState("");
  const [slot, setSlot] = useState(match.group === "equipment" ? UI_TO_PRESET_SLOT[match.index] : 0);
  const [category, setCategory] = useState("Other Gear");
  const [config, setConfig] = useState<ContributionConfig | null>(null);
  const [icons, setIcons] = useState<ContributionIcon[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const verification = useRef<HTMLDivElement>(null);
  const challenge = useRef<Challenge>();
  const task = useRef<AbortController>();
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    void client.config(endpoint).then(value => { if (active.current) setConfig(value); })
      .catch(error => { if (active.current) setError(error.message); });
    return () => { active.current = false; task.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!config || !verification.current) return;
    let disposed = false;
    let widget: Challenge | undefined;
    void client.challenge(verification.current, config.siteKey, value => { if (!disposed) setToken(value); })
      .then(value => { if (disposed) value.remove(); else { widget = value; challenge.current = value; } })
      .catch(error => { if (!disposed) setError(error.message); });
    return () => { disposed = true; widget?.remove(); challenge.current = undefined; };
  }, [config]);
  const read = async (file: File) => {
    task.current?.abort(); const current = new AbortController(); task.current = current;
    setBusy(true); setError(""); setIcons([]); setSelected(0); setUrl("");
    try { const result = await client.read(file, current.signal); if (!current.signal.aborted) setIcons(result); }
    catch (error) { if (!current.signal.aborted) setError(error instanceof Error ? error.message : "Could not read the image."); }
    finally { if (!current.signal.aborted) setBusy(false); }
  };
  const submit = async () => {
    if (!config || !icons[selected] || !token || busy) return;
    setBusy(true); setError("");
    try {
      const result = await client.submit(endpoint, { id, name, category, preset_slot: slot,
        id_aliases: aliases.split(/[\s,]+/).filter(Boolean) }, icons[selected].original, token);
      if (active.current) setUrl(result.url);
    } catch (error) { if (active.current) setError(error instanceof Error ? error.message : "Could not submit the item."); }
    finally { if (active.current) { setBusy(false); challenge.current?.reset(); } }
  };
  return <Dialog open fullWidth maxWidth="sm" onClose={() => { if (!busy) onClose(); }} aria-labelledby="contribution-title"
    onPaste={event => { event.stopPropagation(); const file = Array.from(event.clipboardData.files).find(file => file.type === "image/png"); if (file && !busy) { event.preventDefault(); void read(file); } }}>
    <DialogTitle id="contribution-title">Suggest missing item</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box component="img" src={match.thumbnail} alt={slotLabel(match)} sx={{ width: 40, height: 40, objectFit: "contain" }} />
        <DialogContentText>Search the catalogue first. Submit an item here if it is missing.</DialogContentText>
      </Stack>
      {!config && <Alert severity="info">Item submissions are not connected yet. You can prepare and download an icon here.</Alert>}
      <Typography variant="body2">Choose or paste an original bank or GE PNG at 100% interface scale, with an opaque background and the full slot border. Then select the item below.</Typography>
      <Button component="label" variant="outlined" disabled={busy || !!url}>Choose bank / GE image
        <input hidden type="file" accept="image/png" aria-label="Missing item screenshot" onChange={event => {
          const file = event.target.files?.[0]; event.target.value = ""; if (file) void read(file);
        }} />
      </Button>
      {!!icons.length && <Box role="group" aria-label="Choose cleaned item" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {icons.map((icon, index) => <Button key={index} aria-label={`Use cleaned item ${index + 1}`} aria-pressed={selected === index}
          variant={selected === index ? "contained" : "outlined"} disabled={busy || !!url} onClick={() => setSelected(index)} sx={{ minWidth: 54, p: 1 }}>
          <Box component="img" src={icon.icon} alt="" sx={{ width: 38, height: 34, imageRendering: "pixelated" }} />
        </Button>)}
      </Box>}
      {icons[selected] && <Button component="a" href={icons[selected].icon} download={(id || "item") + ".png"}>Download cleaned icon</Button>}
      <TextField label="Item name" value={name} disabled={busy || !!url} inputProps={{ maxLength: 120 }} onChange={event => setName(event.target.value)} />
      <TextField label="Item ID" value={id} disabled={busy || !!url} inputProps={{ maxLength: 64 }} helperText="Lowercase letters, numbers, underscores or hyphens." onChange={event => setId(event.target.value.toLowerCase())} />
      <TextField label="Aliases (optional)" value={aliases} disabled={busy || !!url} inputProps={{ maxLength: 650 }} helperText="Separate aliases with commas." onChange={event => setAliases(event.target.value.toLowerCase())} />
      <TextField select label="Category" value={category} disabled={busy || !!url} onChange={event => setCategory(event.target.value)}>
        {(config?.categories || ["Other Gear"]).map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
      </TextField>
      <TextField select label="Item slot" value={slot} disabled={busy || !!url} onChange={event => setSlot(Number(event.target.value))}>
        {slots.map((label, value) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
      </TextField>
      <Typography variant="body2" color="text.secondary">Submitting sends only the selected slot and these details for a public draft pull request. A maintainer reviews it before adding the item. No GitHub login is needed.</Typography>
      <Box ref={verification} />
      {error && <Alert severity="error">{error}</Alert>}
      {url && <Alert severity="success">Item submitted. <a href={url} target="_blank" rel="noreferrer">View draft pull request</a></Alert>}
    </Stack></DialogContent>
    <DialogActions>
      <Button disabled={busy} onClick={onClose}>{url ? "Done" : "Cancel"}</Button>
      {!url && <Button variant="contained" onClick={() => void submit()}
        disabled={busy || !config || !icons[selected] || !token || name.trim().length < 2 || !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(id)}>{busy ? "Working..." : "Submit item"}</Button>}
    </DialogActions>
  </Dialog>;
}
