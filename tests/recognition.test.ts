import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createCanvas, loadImage, Image as CanvasImage } from "@napi-rs/canvas";
import { afterEach, expect, test, vi } from "vitest";
import { loadAtlas, readScreenshot, resolveTemplates, scanScreenshot, templatesForSlot } from "../src/imageImport/recognition";
import type { EmojiMaps } from "../src/emoji/types";
import type { Template } from "../src/imageImport/matcher";

afterEach(() => vi.unstubAllGlobals());
const metadata = JSON.parse(readFileSync(resolve("src/assets/recognition/recognition.json"), "utf8"));
const atlasBytes = readFileSync(resolve("src/assets/recognition/recognition.png"));
const ids = Array.from(new Set<string>(metadata.records.map((entry: Template) => entry.id))).filter(Boolean);
const maps: EmojiMaps = {
  byId: Object.fromEntries(ids.map(id => [id, { id, name: id }])), byAlias: {}, byType: {}, bySlot: {},
  resolve: id => id, get: id => maps.byId[id], getUrl: () => undefined,
};

function canvasBrowser() {
  vi.stubGlobal("document", { createElement: () => createCanvas(1, 1) });
  vi.stubGlobal("Image", function () {
    const image = new CanvasImage();
    const descriptor = Object.getOwnPropertyDescriptor(CanvasImage.prototype, "src")!;
    Object.defineProperty(image, "src", { set: () => descriptor.set!.call(image, atlasBytes) });
    return image;
  });
}

test("the browser loader retries failed requests and the scanner reads the bundled atlas", async () => {
  canvasBrowser();
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: false })
    .mockResolvedValue({ ok: true, json: async () => metadata });
  vi.stubGlobal("fetch", fetcher);
  await expect(loadAtlas()).rejects.toThrow("Could not load the item templates");
  const atlas = await loadAtlas();
  expect(atlas).toHaveLength(metadata.records.length);
  expect(atlas[0].vector).toHaveLength(768);
  const source = await loadImage(readFileSync(resolve("tests/fixtures/preset-recognition-icons.png")));
  const canvas = createCanvas(160, 280), ctx = canvas.getContext("2d");
  ctx.fillStyle = "#25231e"; ctx.fillRect(0, 0, 160, 280);
  for (let i = 0; i < 28; i++) ctx.drawImage(source, 0, 0, 40, 40, i % 4 * 40, Math.floor(i / 4) * 40, 40, 40);
  const progress = vi.fn();
  const result = await scanScreenshot(canvas as unknown as HTMLImageElement, "inventory",
    { x: 0, y: 0, w: 160, h: 280 }, maps, new AbortController().signal, progress);
  expect(result).toHaveLength(28);
  expect(result.map(match => match.candidates[0]?.id)).toEqual(Array(28).fill("elderovlsalve"));
  expect(progress).toHaveBeenLastCalledWith(28, 28);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls.every(call => typeof call[0] === "string" && call[0].includes("recognition.json"))).toBe(true);
  const abort = new AbortController(); abort.abort();
  await expect(scanScreenshot(canvas as unknown as HTMLImageElement, "inventory",
    { x: 0, y: 0, w: 160, h: 280 }, maps, abort.signal, vi.fn())).rejects.toThrow();
});

test("renamed IDs resolve before ranking and equipment templates respect the selected slot", () => {
  const vector = new Uint8Array(768);
  const catalogue = { ...maps,
    resolve: (id: string) => id === "old-helm" ? "helm" : id,
    byId: { helm: { id: "helm", name: "Helm", preset_slot: 1 }, boots: { id: "boots", name: "Boots", preset_slot: 7 } },
  };
  const entries = resolveTemplates([
    { id: "old-helm", variant: 0, vector }, { id: "boots", variant: 0, vector },
    { id: "removed", variant: 0, vector }, { id: "", variant: 0, slot: 0, vector }, { id: "", variant: 0, slot: 8, vector },
  ], catalogue);
  expect(entries.map(entry => entry.id)).toEqual(["helm", "boots", "", ""]);
  expect(templatesForSlot(entries, catalogue, { group: "equipment", index: 0, x: 0, y: 0, w: 32, h: 32 })
    .map(entry => entry.id)).toEqual(["helm", ""]);
  expect(templatesForSlot(entries, catalogue, { group: "inventory", index: 0, x: 0, y: 0, w: 32, h: 32 })
    .map(entry => entry.id)).toEqual(["helm", "boots"]);
});

test("unsupported files and oversized uploads are rejected before decoding", async () => {
  const image = vi.fn(); vi.stubGlobal("Image", image);
  await expect(readScreenshot(new File(["text"], "bad.txt", { type: "text/plain" }))).rejects.toThrow("Choose a PNG");
  await expect(readScreenshot(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })))
    .rejects.toThrow("smaller than 10 MB");
  expect(image).not.toHaveBeenCalled();
});

test("decoding failures and dimension limits release the temporary image URL", async () => {
  const revoke = vi.spyOn(URL, "revokeObjectURL");
  vi.stubGlobal("Image", class {
    onerror?: () => void;
    set src(_value: string) { queueMicrotask(() => this.onerror?.()); }
  });
  const file = new File(["invalid"], "broken.png", { type: "image/png" });
  await expect(readScreenshot(file)).rejects.toThrow("Could not decode");
  vi.stubGlobal("Image", class {
    width = 4097; height = 100; onload?: () => void;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  });
  await expect(readScreenshot(file)).rejects.toThrow("4096 pixels");
  expect(revoke).toHaveBeenCalledTimes(2);
  revoke.mockRestore();
});
