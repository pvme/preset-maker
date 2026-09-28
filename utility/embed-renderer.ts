import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { loadEmojis } from "../src/emoji/loadEmojis";
import { normalizePreset } from "../src/redux/store/reducers/normalizePreset";
const require = createRequire(import.meta.url);
const { createRenderer } = require("../embed-renderer/lib/render-core.js");
const resolveSlot = (slot: any, maps: Awaited<ReturnType<typeof loadEmojis>>) => {
  const id = maps.resolve(slot?.id || "");
  return { ...slot, id, name: maps.get(id)?.name || id, image: maps.getUrl(id) };
};
export function makeEmbedRenderer(options: { fetchImageBytes?: (url: string) => Promise<Buffer> } = {}) {
  return createRenderer({
  createCanvas, loadImage,
  renderScale: 2,
  failOnImageError: true,
  loadLocal: (name: string) => loadImage(fileURLToPath(new URL(`../src/assets/${name}`, import.meta.url))),
  loadIconMap: loadEmojis,
  normalizePresetToV2: async (raw: unknown) => {
    // Prime the shared catalogue with a bounded request before normalization.
    await loadEmojis(AbortSignal.timeout(15_000));
    return normalizePreset(raw);
  },
  resolveSlot,
  resolveArray: (slots: any[], maps: any) => (slots || []).map(slot => resolveSlot(slot, maps)),
  ...options,
});
}
export const { renderPresetImage } = makeEmbedRenderer();
