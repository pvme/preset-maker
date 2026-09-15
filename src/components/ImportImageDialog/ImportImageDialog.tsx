import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, LinearProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { useSnackbar } from "notistack";
import { loadEmojis } from "../../emoji/loadEmojis";
import type { EmojiMaps } from "../../emoji/types";
import { useAppDispatch } from "../../redux/hooks";
import { applyImageImport } from "../../redux/store/reducers/preset-reducer";
import { KEEP_CURRENT, type Box as CropBox, type Layout, type Region } from "../../imageImport/matcher";
import { detectScreenshot, readScreenshot, scanScreenshot, type Match } from "../../imageImport/recognition";
import { CropPreview } from "./CropPreview";
import { MatchReview } from "./MatchReview";

interface Props { onClose: () => void; editable: boolean }

export default function ImportImageDialog({ onClose, editable }: Props) {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [image, setImage] = useState<HTMLImageElement>();
  const [filename, setFilename] = useState("");
  const [layout, setLayout] = useState<Layout>("auto");
  const [detected, setDetected] = useState<Region[]>([]);
  const [locating, setLocating] = useState(false);
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 1, h: 1 });
  const [matches, setMatches] = useState<Match[]>([]);
  const [maps, setMaps] = useState<EmojiMaps>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const revision = useRef(0);
  const controller = useRef<AbortController>();
  const fileInput = useRef<HTMLInputElement>(null);
  const review = useRef<HTMLDivElement>(null);

  useEffect(() => () => { revision.current++; controller.current?.abort(); }, []);

  useEffect(() => {
    if (!image || layout !== "auto") { setLocating(false); return; }
    const task = new AbortController();
    setDetected([]); setLocating(true); setStatus("Detecting inventory and equipment slots...");
    const timer = setTimeout(() => {
      void detectScreenshot(image, crop, task.signal).then(result => {
        if (task.signal.aborted) return;
        setDetected(result.regions);
        setStatus(result.regions.length
          ? `Detected ${[result.inventory ? "28 inventory slots" : "", result.equipment ? "12 equipment slots" : ""].filter(Boolean).join(" and ")}. Ready to find items.`
          : "No complete slot layout detected. Crop around the panels or choose a manual layout.");
      }).catch(error => {
        if (!task.signal.aborted) setError(error instanceof Error ? error.message : "Could not detect slots.");
      }).finally(() => { if (!task.signal.aborted) setLocating(false); });
    }, 150);
    return () => { clearTimeout(timer); task.abort(); };
  }, [image, crop, layout]);

  const invalidate = () => {
    revision.current++;
    controller.current?.abort();
    setBusy(false); setMatches([]); setError(""); setStatus(""); setProgress(0);
  };
  const readFile = async (file: File) => {
    invalidate();
    const version = revision.current;
    setReading(true); setImage(undefined); setFilename(""); setDetected([]); setLayout("auto");
    try {
      const next = await readScreenshot(file);
      if (version !== revision.current) return;
      setImage(next); setFilename(file.name || "Pasted screenshot");
      setCrop({ x: 0, y: 0, w: next.width, h: next.height });
    } catch (error) {
      if (version === revision.current) setError(error instanceof Error ? error.message : "Could not read the screenshot.");
    } finally {
      if (version === revision.current) setReading(false);
    }
  };
  const updateCrop = (next: CropBox) => { invalidate(); setDetected([]); setLocating(layout === "auto"); setCrop(next); };
  const changeField = (field: keyof CropBox, value: number) => {
    if (!image || !Number.isFinite(value)) return;
    const next = { ...crop, [field]: Math.round(value) };
    next.x = Math.max(0, Math.min(next.x, image.width - 1));
    next.y = Math.max(0, Math.min(next.y, image.height - 1));
    next.w = Math.max(1, Math.min(next.w, image.width - next.x));
    next.h = Math.max(1, Math.min(next.h, image.height - next.y));
    updateCrop(next);
  };
  const scan = async () => {
    if (!image || busy || !editable || locating || (layout === "auto" && !detected.length)) return;
    invalidate();
    const version = revision.current;
    const task = new AbortController(); controller.current = task;
    setBusy(true); setStatus("Loading item templates...");
    try {
      const catalogue = await loadEmojis();
      if (version !== revision.current) return;
      setMaps(catalogue);
      const result = await scanScreenshot(image, layout, crop, catalogue, task.signal, (done, total) => {
        if (version !== revision.current) return;
        setProgress(done / total * 100); setStatus(`Finding items: ${done} / ${total}`);
      }, detected);
      if (version !== revision.current) return;
      setMatches(result);
      setStatus(`Found suggestions for ${result.length} slots. ${result.filter(match => !match.confident).length} need checking.`);
    } catch (error) {
      if (version === revision.current && !task.signal.aborted) {
        setError(error instanceof Error ? error.message : "Could not find items. Try again.");
        setStatus("");
      }
    } finally {
      if (version === revision.current) setBusy(false);
    }
  };
  useEffect(() => { if (matches.length) review.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [matches.length]);

  const changes = matches.filter(match => match.selected !== KEEP_CURRENT);
  return <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="import-image-title"
    onPaste={event => {
      const file = Array.from(event.clipboardData.files).find(entry => entry.type.startsWith("image/"));
      if (file) { event.preventDefault(); void readFile(file); }
    }}>
    <DialogTitle id="import-image-title">Import Image</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <DialogContentText>
          Choose or paste a screenshot. Inventory and equipment slots are detected automatically, then you can review the suggested items.
          Your screenshot stays in your browser.
        </DialogContentText>
        {!editable && <Alert severity="info">This preset is read-only. Duplicate it with New Preset to import items.</Alert>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => fileInput.current?.click()}>
            Choose image
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
            {reading ? "Reading image..." : filename || "PNG, JPEG or WebP, up to 10 MB"}
          </Typography>
          <input hidden ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Screenshot file"
            onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void readFile(file); }} />
        </Stack>
        {error && <Alert severity="error" role="alert">{error}</Alert>}
        {image && <>
          <TextField select label="Screenshot layout" value={layout} size="small"
            onChange={event => { invalidate(); setDetected([]); setLocating(event.target.value === "auto"); setLayout(event.target.value as Layout); }}>
            <MenuItem value="auto">Auto-detect slots</MenuItem>
            <MenuItem value="game">Manual: inventory and equipment (reference layout)</MenuItem>
            <MenuItem value="inventory">Manual: inventory only (4 columns, 7 rows)</MenuItem>
            <MenuItem value="equipment">Manual: equipment only (in-game worn slots)</MenuItem>
          </TextField>
          <Typography variant="body2" color="text.secondary">
            {layout === "auto" ? "The boxes show the detected slots. Crop around the panels only if needed, or choose a manual layout."
              : layout === "game" ? "Crop to the full in-game preset panel, including its bottom toolbar."
              : layout === "inventory" ? "Crop tightly around the 4 by 7 inventory grid."
                : "Crop tightly around the worn slots, from the head and pocket to the gloves, boots and ring."}
            {layout !== "auto" && " Drag on the image or adjust the crop below until the outlines line up with the items."}
          </Typography>
          <CropPreview image={image} crop={crop} layout={layout} detected={detected} onChange={updateCrop} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.5 }}>
            {([['x', 'Left'], ['y', 'Top'], ['w', 'Width'], ['h', 'Height']] as const).map(([key, label]) =>
              <TextField key={key} type="number" size="small" label={label} value={crop[key]}
                inputProps={{ min: key === "x" || key === "y" ? 0 : 1, step: 1,
                  max: key === "x" ? image.width - 1 : key === "y" ? image.height - 1 : key === "w" ? image.width - crop.x : image.height - crop.y }}
                onChange={event => changeField(key, Number(event.target.value))} />)}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => void scan()} disabled={busy || locating || !editable || (layout === "auto" && !detected.length) || crop.w < 16 || crop.h < 16}>
              {busy ? "Finding items..." : "Find items"}
            </Button>
            <Button onClick={() => updateCrop({ x: 0, y: 0, w: image.width, h: image.height })}>Reset crop</Button>
          </Stack>
        </>}
        {(busy || locating) && <LinearProgress variant={busy && progress ? "determinate" : "indeterminate"} value={progress} aria-label={locating ? "Detecting slots" : "Finding items"} />}
        <Box ref={review} aria-live="polite"><Typography variant="body2">{status}</Typography></Box>
        {!!matches.length && maps && <MatchReview matches={matches} maps={maps} onSelect={(target, id) =>
          setMatches(current => current.map(match => match.group === target.group && match.index === target.index
            ? { ...match, selected: id } : match))} />}
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" disabled={!editable || busy || !changes.length} onClick={() => {
        if (!editable || busy || !maps || !changes.length) return;
        dispatch(applyImageImport(changes.filter(match => !match.selected || !!maps.byId[match.selected])));
        enqueueSnackbar("Items imported. Save the preset to keep your changes.", { variant: "success" });
        onClose();
      }}>Apply items{changes.length ? ` (${changes.length})` : ""}</Button>
    </DialogActions>
  </Dialog>;
}
