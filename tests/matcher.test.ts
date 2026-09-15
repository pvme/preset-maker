import { readFile } from "node:fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { expect, test } from "vitest";
import { fingerprint, suggest, regions, KEEP_CURRENT, type Template, type Layout } from "../src/imageImport/matcher";
import reducer, { applyImageImport, importDataAction } from "../src/redux/store/reducers/preset-reducer";
import { blankPreset } from "../src/schemas/preset";

const fixtureIds = ["elderovlsalve", "nightmaregauntlets", "stalkerring", "vestmentsofhavochood",
  "scriptureofful", "pernixsquiveryellow", "rod"];

async function readAtlas(): Promise<Template[]> {
  const metadata = JSON.parse(await readFile(new URL("../src/assets/recognition/recognition.json", import.meta.url), "utf8"));
  const image = await loadImage(await readFile(new URL("../src/assets/recognition/recognition.png", import.meta.url)));
  const ctx = createCanvas(image.width, image.height).getContext("2d");
  ctx.drawImage(image, 0, 0);
  return metadata.records.map((entry: Omit<Template, "vector">, i: number) => {
    const pixels = ctx.getImageData(i % metadata.columns * metadata.size,
      Math.floor(i / metadata.columns) * metadata.size, metadata.size, metadata.size).data;
    const vector = new Uint8Array(metadata.size ** 2 * 3);
    for (let p = 0; p < metadata.size ** 2; p++) vector.set(pixels.subarray(p * 4, p * 4 + 3), p * 3);
    return { ...entry, vector };
  });
}

test("committed atlas identifies original item icons after scaling and JPEG compression", async () => {
  const atlas = await readAtlas();
  const icons = await loadImage(await readFile(new URL("fixtures/preset-recognition-icons.png", import.meta.url)));
  const original = createCanvas(358, 304), originalCtx = original.getContext("2d");
  originalCtx.fillStyle = "#25231e"; originalCtx.fillRect(0, 0, 358, 304);
  for (let i = 0; i < 28; i++) originalCtx.drawImage(icons, (i % fixtureIds.length) * 40, 0, 40, 40,
    18 + i % 4 * 40, 3 + Math.floor(i / 4) * 36, 40, 40);
  for (const scale of [1, 2]) {
    const scaled = createCanvas(original.width * scale, original.height * scale);
    scaled.getContext("2d").drawImage(original, 0, 0, scaled.width, scaled.height);
    const image = scale === 1 ? scaled : await loadImage(scaled.toBuffer("image/jpeg", 90));
    let recognised = 0;
    for (const region of regions("game", { x: 0, y: 0, w: image.width, h: image.height }).filter(r => r.group === "inventory")) {
      const ctx = createCanvas(36, 32).getContext("2d");
      ctx.drawImage(image, region.x, region.y, region.w, region.h, 0, 0, 36, 32);
      const pixels = ctx.getImageData(0, 0, 36, 32);
      const result = suggest([fingerprint(pixels), fingerprint(pixels, true)], atlas);
      if (result.candidates[0]?.id === fixtureIds[region.index % fixtureIds.length]) recognised++;
    }
    expect(recognised, `Recognised ${recognised}/28 at ${scale}x`).toBeGreaterThanOrEqual(25);
  }
});

test("ambiguous variants and blank cells keep existing items until reviewed", () => {
  const ctx = createCanvas(32, 32).getContext("2d");
  ctx.fillStyle = "#28c3ec"; ctx.fillRect(7, 6, 12, 20);
  const query = fingerprint(ctx.getImageData(0, 0, 32, 32));
  const entries = ["dose1", "dose2"].flatMap(id => [0, 1].map(variant => ({ id, variant, vector: query.vector })));
  expect(suggest([query, query], entries)).toMatchObject({ selected: KEEP_CURRENT, confident: false });
  ctx.clearRect(0, 0, 32, 32);
  const empty = fingerprint(ctx.getImageData(0, 0, 32, 32));
  expect(suggest([empty, empty], entries).selected).toBe(KEEP_CURRENT);
});

test("crop layouts remain within bounds and map equipment into PvME's slot order", () => {
  const box = { x: 47, y: 63, w: 716, h: 608 };
  for (const [layout, count] of [["game", 40], ["inventory", 28], ["equipment", 12]] as [Layout, number][]) {
    const slots = regions(layout, box);
    expect(slots).toHaveLength(count);
    for (const slot of slots) {
      expect(slot.x).toBeGreaterThanOrEqual(box.x); expect(slot.y).toBeGreaterThanOrEqual(box.y);
      expect(slot.x + slot.w).toBeLessThanOrEqual(box.x + box.w + .01);
      expect(slot.y + slot.h).toBeLessThanOrEqual(box.y + box.h + .01);
    }
  }
  const gear = regions("equipment", box);
  expect(gear[0].y).toBeLessThan(gear[4].y);
  expect(gear[4].y).toBeLessThan(gear[6].y);
  expect(gear[6].y).toBeLessThan(gear[8].y);
  expect(gear[3].x).toBeLessThan(gear[4].x);
  expect(gear[4].x).toBeLessThan(gear[5].x);
});

test("applying a review preserves preset metadata and unchanged EoFs, and clears explicit empty slots", () => {
  const preset = structuredClone(blankPreset);
  preset.presetName = "AoD"; preset.presetNotes = "Keep these notes";
  preset.inventorySlots[0] = { id: "old", eof_spec: "Old weapon" };
  preset.inventorySlots[1] = { id: "eof", eof_spec: "Dark bow" };
  preset.inventorySlots[2] = { id: "unresolved" };
  preset.equipmentSlots[0] = { id: "helm" };
  preset.familiar = { id: "ripper" }; preset.relics = [{ id: "relic" }];
  preset.ammoSpells = [{ id: "spell" }]; preset.aspect = { id: "aspect" };
  preset.breakdown = [{ slotType: "inventory", slotIndex: 1, description: "EoF switch" }];
  const before = reducer(undefined, importDataAction(preset));
  const after = reducer(before, applyImageImport([
    { group: "inventory", index: 0, selected: "new" },
    { group: "inventory", index: 1, selected: "eof" },
    { group: "inventory", index: 2, selected: KEEP_CURRENT },
    { group: "equipment", index: 0, selected: "" },
    { group: "inventory", index: 99, selected: "invalid" },
    { group: "inventory", index: -1, selected: "invalid" },
  ]));
  expect(after.inventorySlots[0]).toEqual({ id: "new" });
  expect(after.inventorySlots[1]).toEqual({ id: "eof", eof_spec: "Dark bow" });
  expect(after.inventorySlots[2]).toEqual({ id: "unresolved" });
  expect(after.equipmentSlots[0]).toEqual({ id: "" });
  expect({ ...after, inventorySlots: before.inventorySlots, equipmentSlots: before.equipmentSlots }).toEqual(before);
  expect(before.inventorySlots[0]).toEqual({ id: "old", eof_spec: "Old weapon" });
});
