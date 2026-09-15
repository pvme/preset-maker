import type { EmojiMaps } from "../emoji/types";
import { UI_TO_PRESET_SLOT } from "../components/PresetEditor/equipmentSlots";
import atlasUrl from "../assets/recognition/recognition.png";
import metadataUrl from "../assets/recognition/recognition.json?url";
import { createPresetLayoutDetector } from "./layoutDetector.mjs";
import { FINGERPRINT_SIZE, fingerprint, suggest, regions, type Box, type Layout,
  type Region, type Selection, type Template, type Candidate } from "./matcher";

export interface Match extends Selection {
  thumbnail: string;
  candidates: Candidate[];
  confident: boolean;
}

export async function detectScreenshot(image: HTMLImageElement, box: Box, signal: AbortSignal) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(box.w); canvas.height = Math.round(box.h);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser could not read the screenshot.");
  ctx.drawImage(image, box.x, box.y, box.w, box.h, 0, 0, canvas.width, canvas.height);
  const result = await createPresetLayoutDetector().detectAsync(ctx.getImageData(0, 0, canvas.width, canvas.height), signal);
  return { ...result, regions: result.regions.map(region => ({ ...region,
    x: box.x + region.x * box.w / canvas.width, y: box.y + region.y * box.h / canvas.height,
    w: region.w * box.w / canvas.width, h: region.h * box.h / canvas.height })) };
}

export function imageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode the image. Try a PNG, JPEG or WebP file."));
    image.src = url;
  });
}

export async function readScreenshot(file: File): Promise<HTMLImageElement> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Choose a PNG, JPEG or WebP screenshot.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose an image smaller than 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = await imageFromUrl(url);
    if (image.width > 4096 || image.height > 4096) {
      throw new Error("Crop the screenshot to at most 4096 pixels on each side first.");
    }
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

let atlasPromise: Promise<Template[]> | undefined;
export function loadAtlas(): Promise<Template[]> {
  if (!atlasPromise) {
    atlasPromise = (async () => {
      const [response, image] = await Promise.all([fetch(metadataUrl), imageFromUrl(atlasUrl)]);
      if (!response.ok) throw new Error("Could not load the item templates. Try Find items again.");
      const meta: { version: number; size: number; columns: number; records: Omit<Template, "vector">[] } = await response.json();
      if (meta.version !== 1 || meta.size !== FINGERPRINT_SIZE || !meta.records.length) {
        throw new Error("The item templates are incompatible. Refresh the page and try again.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Your browser could not read the image.");
      ctx.drawImage(image, 0, 0);
      return meta.records.map((entry, i) => {
        const pixels = ctx.getImageData(i % meta.columns * meta.size,
          Math.floor(i / meta.columns) * meta.size, meta.size, meta.size).data;
        const vector = new Uint8Array(meta.size ** 2 * 3);
        for (let p = 0; p < meta.size ** 2; p++) vector.set(pixels.subarray(p * 4, p * 4 + 3), p * 3);
        return { ...entry, vector };
      });
    })().catch(error => { atlasPromise = undefined; throw error; });
  }
  return atlasPromise;
}

export function resolveTemplates(templates: Template[], maps: EmojiMaps): Template[] {
  return templates.flatMap(template => {
    if (!template.id) return [template];
    const id = maps.resolve(template.id);
    return maps.byId[id] ? [{ ...template, id }] : [];
  });
}

export function templatesForSlot(templates: Template[], maps: EmojiMaps, region: Region) {
  return templates.filter(entry => {
    if (!entry.id) return region.group === "equipment" && entry.slot === region.index;
    const slot = maps.byId[entry.id]?.preset_slot;
    return region.group === "inventory" || !slot || slot === UI_TO_PRESET_SLOT[region.index];
  });
}

export async function scanScreenshot(image: HTMLImageElement, layout: Layout, box: Box,
  maps: EmojiMaps, signal: AbortSignal, onProgress: (done: number, total: number) => void, detected?: Region[]): Promise<Match[]> {
  const templates = resolveTemplates(await loadAtlas(), maps);
  signal.throwIfAborted();
  const slots = layout === "auto" ? detected ?? (await detectScreenshot(image, box, signal)).regions : regions(layout, box);
  if (!slots.length) throw new Error("No slots detected. Crop around the panels or choose a manual layout.");
  const canvas = document.createElement("canvas");
  canvas.height = 32;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser could not read the screenshot.");
  const matches: Match[] = [];
  for (const region of slots) {
    signal.throwIfAborted();
    canvas.width = region.group === "inventory" ? 36 : 32;
    ctx.drawImage(image, region.x, region.y, region.w, region.h, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const suggestion = suggest([fingerprint(pixels), fingerprint(pixels, true)],
      templatesForSlot(templates, maps, region));
    matches.push({ group: region.group, index: region.index, thumbnail: canvas.toDataURL(), ...suggestion });
    onProgress(matches.length, slots.length);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  signal.throwIfAborted();
  return matches;
}
