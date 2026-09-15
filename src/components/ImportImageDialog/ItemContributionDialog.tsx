import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography } from "@mui/material";
import { createPresetIconContribution, type ContributionIcon } from "../../imageImport/iconContribution.mjs";
import type { Match } from "../../imageImport/recognition";
import { slotLabel } from "./MatchReview";

const client = createPresetIconContribution(import.meta.env.BASE_URL + "icon-cleanup");

export function ItemContributionDialog({ match, source, onClose }: { match: Match; source?: HTMLImageElement; onClose: () => void }) {
  const [icons, setIcons] = useState<ContributionIcon[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const task = useRef<AbortController>();
  useEffect(() => () => { task.current?.abort(); }, []);
  useEffect(() => {
    if (!source) return;
    const current = new AbortController(); task.current = current;
    setBusy(true); setError(""); setIcons([]); setSelected(-1); setStatus("Preparing items from your uploaded screenshot...");
    void client.prepare(source, match.region, current.signal).then(result => {
      if (current.signal.aborted) return;
      setIcons(result.icons); setSelected(result.selected);
      setStatus(result.selected >= 0 ? "Selected item prepared from your uploaded screenshot."
        : "Your uploaded screenshot is loaded. Choose this item from the bank slots below. If it is not there, choose a bank or GE image containing it.");
    }).catch(error => {
      if (!current.signal.aborted) { setStatus(""); setError(error instanceof Error ? error.message : "Could not prepare this screenshot."); }
    }).finally(() => { if (!current.signal.aborted) setBusy(false); });
    return () => current.abort();
  }, [source, match.region]);
  const read = async (file: File) => {
    task.current?.abort(); const current = new AbortController(); task.current = current;
    setBusy(true); setError(""); setIcons([]); setSelected(0); setStatus("");
    try { const result = await client.read(file, current.signal); if (!current.signal.aborted) setIcons(result); }
    catch (error) { if (!current.signal.aborted) setError(error instanceof Error ? error.message : "Could not read the image."); }
    finally { if (!current.signal.aborted) setBusy(false); }
  };
  return <Dialog open fullWidth maxWidth="sm" onClose={() => { if (!busy) onClose(); }} aria-labelledby="contribution-title"
    onPaste={event => { event.stopPropagation(); const file = Array.from(event.clipboardData.files).find(file => file.type === "image/png"); if (file && !busy) { event.preventDefault(); void read(file); } }}>
    <DialogTitle id="contribution-title">Suggest missing item</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      {source ? <Stack direction="row" spacing={2} alignItems="center">
        <Box component="img" src={match.thumbnail} alt={slotLabel(match)} sx={{ width: 40, height: 40, objectFit: "contain" }} />
        <DialogContentText>Search the catalogue first. Submit an item here if it is missing.</DialogContentText>
      </Stack> : <DialogContentText>Search the catalogue first. Submit an item here if it is missing.</DialogContentText>}
      <Alert severity="info">Item submissions are not connected yet. You can prepare and download an icon here.</Alert>
      <Typography variant="body2">The uploaded screenshot is reused where possible. Cleanup needs an original bank or GE slot at 100% interface scale, with an opaque background and the full slot border.</Typography>
      {status && <Typography variant="body2" role="status">{status}</Typography>}
      <Button component="label" variant="outlined" disabled={busy}>{source ? "Choose another bank / GE image" : "Choose bank / GE image"}
        <input hidden type="file" accept="image/png" aria-label="Missing item screenshot" onChange={event => {
          const file = event.target.files?.[0]; event.target.value = ""; if (file) void read(file);
        }} />
      </Button>
      {!!icons.length && <Box role="group" aria-label="Choose cleaned item" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {icons.map((icon, index) => <Button key={index} aria-label={`Use cleaned item ${index + 1}`} aria-pressed={selected === index}
          variant={selected === index ? "contained" : "outlined"} disabled={busy} onClick={() => setSelected(index)} sx={{ minWidth: 54, p: 1 }}>
          <Box component="img" src={icon.icon} alt="" sx={{ width: 38, height: 34, imageRendering: "pixelated" }} />
        </Button>)}
      </Box>}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack></DialogContent>
    <DialogActions>
      <Button disabled={busy} onClick={onClose}>Done</Button>
    </DialogActions>
  </Dialog>;
}
