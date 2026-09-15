import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider, createTheme } from "@mui/material";
import { SnackbarProvider } from "notistack";
import ImportImageDialog from "../src/components/ImportImageDialog/ImportImageDialog";
import reducer, { setInventorySlot } from "../src/redux/store/reducers/preset-reducer";
import { detectScreenshot, readScreenshot, scanScreenshot, type Match } from "../src/imageImport/recognition";
import { loadEmojis } from "../src/emoji/loadEmojis";
import type { EmojiMaps } from "../src/emoji/types";

vi.mock("../src/imageImport/recognition", () => ({ detectScreenshot: vi.fn(), readScreenshot: vi.fn(), scanScreenshot: vi.fn() }));
vi.mock("../src/emoji/loadEmojis", () => ({ loadEmojis: vi.fn() }));

const maps: EmojiMaps = {
  byId: {
    potion: { id: "potion", name: "Overload", id_aliases: ["ovl"] },
    weapon: { id: "weapon", name: "Granite maul", preset_slot: 5 },
  }, byAlias: { ovl: "potion" }, bySlot: {}, byType: {},
  get: id => maps.byId[id], resolve: id => maps.byAlias[id] ?? id,
  getUrl: () => "data:image/png;base64,",
};
const results: Match[] = [
  { group: "inventory", index: 0, selected: "potion", confident: true, thumbnail: "data:image/png;base64,", candidates: [{ id: "potion", score: .1, vector: new Uint8Array(24 * 24 * 3) } as Match["candidates"][number]] },
  { group: "inventory", index: 1, selected: "__keep__", confident: false, thumbnail: "data:image/png;base64,", candidates: [{ id: "weapon", score: .5 }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  const image = new Image(); image.width = 358; image.height = 304;
  vi.mocked(readScreenshot).mockResolvedValue(image);
  vi.mocked(loadEmojis).mockResolvedValue(maps);
  vi.mocked(detectScreenshot).mockResolvedValue({ regions: [{ group: "inventory", index: 0, x: 23, y: 19, w: 36, h: 32 }], inventory: true, equipment: false });
  vi.mocked(scanScreenshot).mockResolvedValue(structuredClone(results));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect: vi.fn(), drawImage: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), fill: vi.fn(), fillText: vi.fn(), strokeRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  window.PointerEvent = MouseEvent as typeof PointerEvent;
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function setup(editable = true) {
  const store = configureStore({ reducer: { preset: reducer } });
  const onClose = vi.fn();
  const view = (allowed: boolean) => <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
    <Provider store={store}><SnackbarProvider><ImportImageDialog editable={allowed} onClose={onClose} /></SnackbarProvider></Provider>
  </ThemeProvider>;
  const rendered = render(view(editable));
  return { store, onClose, ...rendered, setEditable: (allowed: boolean) => rendered.rerender(view(allowed)) };
}
async function uploadAndScan() {
  fireEvent.change(screen.getByLabelText("Screenshot file"), { target: { files: [new File(["image"], "preset.png", { type: "image/png" })] } });
  const find = await screen.findByRole("button", { name: "Find items" }) as HTMLButtonElement;
  await waitFor(() => expect(find.disabled).toBe(false));
  fireEvent.click(find);
  await screen.findByRole("region", { name: "Needs checking" });
}

test("uncertain matches come first; manual alias search and Apply update the preset", async () => {
  const { store, onClose } = setup();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  await uploadAndScan();
  expect(screen.getAllByRole("region").map(node => node.getAttribute("aria-label"))).toEqual(["Needs checking", "Confident matches"]);
  fireEvent.click(screen.getByRole("button", { name: "Search items for Inventory 2" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Search Inventory 2" }), { target: { value: "ovl" } });
  fireEvent.click(await screen.findByRole("option", { name: "Overload" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply items (2)" }));
  expect(store.getState().preset.inventorySlots.slice(0, 2)).toEqual([{ id: "potion" }, { id: "potion" }]);
  expect(onClose).toHaveBeenCalledOnce();
  expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining("non-serializable"));
});

test("disabling overwrite preserves existing slots while importing into empty ones", async () => {
  const { store } = setup();
  store.dispatch(setInventorySlot({ index: 0, value: { id: "weapon" } }));
  await uploadAndScan();
  fireEvent.click(screen.getByRole("button", { name: "Search items for Inventory 2" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Search Inventory 2" }), { target: { value: "Granite" } });
  fireEvent.click(await screen.findByRole("option", { name: "Granite maul" }));
  const overwrite = screen.getByRole("checkbox", { name: "Overwrite existing slots" }) as HTMLInputElement;
  expect(overwrite.checked).toBe(true);
  fireEvent.click(overwrite);
  expect(overwrite.checked).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Apply items (1)" }));
  expect(store.getState().preset.inventorySlots[0]).toEqual({ id: "weapon" });
  expect(store.getState().preset.inventorySlots[1]).toEqual({ id: "weapon" });
});

test("changing the crop invalidates the review and prevents applying stale matches", async () => {
  setup(); await uploadAndScan();
  fireEvent.change(screen.getByRole("spinbutton", { name: "Left" }), { target: { value: "2" } });
  expect(screen.queryByRole("region", { name: "Needs checking" })).toBeNull();
  expect((screen.getByRole("button", { name: "Apply items" }) as HTMLButtonElement).disabled).toBe(true);
});

test("a cancelled scan cannot restore results after a layout change", async () => {
  let complete!: (matches: Match[]) => void;
  vi.mocked(scanScreenshot).mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  setup();
  fireEvent.change(screen.getByLabelText("Screenshot file"), { target: { files: [new File(["image"], "preset.png", { type: "image/png" })] } });
  const find = await screen.findByRole("button", { name: "Find items" }) as HTMLButtonElement;
  await waitFor(() => expect(find.disabled).toBe(false));
  fireEvent.click(find);
  await waitFor(() => expect(scanScreenshot).toHaveBeenCalledOnce());
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Screenshot layout" }));
  fireEvent.click(await screen.findByRole("option", { name: "Manual" }));
  await act(async () => complete(results));
  expect(vi.mocked(scanScreenshot).mock.calls[0][4].aborted).toBe(true);
  expect(screen.queryByRole("region")).toBeNull();
  expect((screen.getByRole("button", { name: "Apply items" }) as HTMLButtonElement).disabled).toBe(true);
});

test("read-only presets cannot scan or apply, including when edit access changes during review", async () => {
  const { store, setEditable } = setup(); await uploadAndScan(); setEditable(false);
  expect((screen.getByRole("button", { name: "Apply items (1)" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Find items" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Apply items (1)" }));
  expect(store.getState().preset.inventorySlots.every(item => !item.id)).toBe(true);
});

test("Cancel leaves the preset untouched and an image error can be retried", async () => {
  const { store, onClose } = setup();
  vi.mocked(readScreenshot).mockRejectedValueOnce(new Error("Choose a PNG, JPEG or WebP screenshot."));
  fireEvent.change(screen.getByLabelText("Screenshot file"), { target: { files: [new File(["bad"], "bad.txt", { type: "text/plain" })] } });
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Choose a PNG, JPEG or WebP screenshot.");
  await uploadAndScan();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(store.getState().preset.inventorySlots.every(item => !item.id)).toBe(true);
});

test("pasting a screenshot into the dialog uses the same import flow", async () => {
  setup();
  const file = new File(["image"], "pasted.png", { type: "image/png" });
  fireEvent.paste(screen.getByRole("dialog"), { clipboardData: { files: [file] } });
  expect(await screen.findByText("pasted.png")).toBeTruthy();
  expect(readScreenshot).toHaveBeenCalledWith(file);
});

test.each([
  [358, 304, 358, 304],
  [1432, 1216, 448, 380],
  [4000, 200, 720, 36],
])("the %ix%i screenshot fits the full %ix%i canvas drawing area", async (sourceWidth, sourceHeight, width, height) => {
  const image = new Image(); image.width = sourceWidth; image.height = sourceHeight;
  vi.mocked(readScreenshot).mockResolvedValue(image);
  setup();
  fireEvent.change(screen.getByLabelText("Screenshot file"), { target: { files: [new File(["image"], "preset.png", { type: "image/png" })] } });
  const canvas = await screen.findByRole("img", { name: /Screenshot with slot outlines/ }) as HTMLCanvasElement;
  expect(canvas.width).toBe(width);
  expect(canvas.height).toBe(height);
  expect(canvas.getContext("2d")?.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, canvas.width, canvas.height);
});


test("automatic detection supplies the actual slot coordinates to the scanner", async () => {
  setup(); await uploadAndScan();
  expect(screen.getByRole("combobox", { name: "Screenshot layout" }).textContent).toBe("Auto-detect slots");
  expect(detectScreenshot).toHaveBeenCalledOnce();
  expect(vi.mocked(scanScreenshot).mock.calls[0][1]).toBe("auto");
  expect(vi.mocked(scanScreenshot).mock.calls[0][6]).toEqual([{ group: "inventory", index: 0, x: 23, y: 19, w: 36, h: 32 }]);
});

test("unrecognized images require alignment instead of scanning guessed slots", async () => {
  vi.mocked(detectScreenshot).mockResolvedValue({ regions: [], inventory: false, equipment: false });
  setup();
  fireEvent.change(screen.getByLabelText("Screenshot file"), { target: { files: [new File(["image"], "preset.png", { type: "image/png" })] } });
  await screen.findByText(/No complete slot layout detected/);
  expect((screen.getByRole("button", { name: "Find items" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Apply items" }) as HTMLButtonElement).disabled).toBe(true);
  expect(scanScreenshot).not.toHaveBeenCalled();
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Screenshot layout" }));
  fireEvent.click(await screen.findByRole("option", { name: "Manual" }));
  expect((screen.getByRole("button", { name: "Find items" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Width" }), { target: { value: "160" } });
  fireEvent.click(screen.getByRole("button", { name: "2. Equipment" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Include equipment" }));
  expect((screen.getByRole("button", { name: "Find items" }) as HTMLButtonElement).disabled).toBe(false);
});

test("changing a crop cancels detection and ignores its late result", async () => {
  let finish!: (value: Awaited<ReturnType<typeof detectScreenshot>>) => void;
  vi.mocked(detectScreenshot).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockResolvedValue({ regions: [], inventory: false, equipment: false });
  setup();
  fireEvent.change(screen.getByLabelText("Screenshot file"), { target: { files: [new File(["image"], "preset.png", { type: "image/png" })] } });
  await waitFor(() => expect(detectScreenshot).toHaveBeenCalledOnce());
  expect((screen.getByRole("button", { name: "Find items" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Left" }), { target: { value: "2" } });
  expect(vi.mocked(detectScreenshot).mock.calls[0][2].aborted).toBe(true);
  await screen.findByText(/No complete slot layout detected/);
  await act(async () => finish({ regions: [{ group: "inventory", index: 0, x: 0, y: 0, w: 32, h: 32 }], inventory: true, equipment: false }));
  expect((screen.getByRole("button", { name: "Find items" }) as HTMLButtonElement).disabled).toBe(true);
});


test("manual placement keeps separate panels, supports grid changes and moves individual equipment slots", async () => {
  setup();
  fireEvent.change(screen.getByLabelText("Screenshot file"), { target: { files: [new File(["image"], "preset.png", { type: "image/png" })] } });
  await screen.findByRole("combobox", { name: "Screenshot layout" });
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Screenshot layout" }));
  expect((await screen.findAllByRole("option")).map(option => option.textContent)).toEqual(["Auto-detect slots", "Manual"]);
  fireEvent.click(screen.getByRole("option", { name: "Manual" }));
  expect((screen.getByRole("button", { name: "2. Equipment" }) as HTMLButtonElement).disabled).toBe(true);
  const field = (name: string, value: number) => fireEvent.change(screen.getByRole("spinbutton", { name }), { target: { value: String(value) } });
  field("Columns", 6);
  expect((screen.getByRole("spinbutton", { name: "Rows" }) as HTMLInputElement).value).toBe("5");
  field("Left", 10); field("Top", 20); field("Width", 180); field("Height", 150);
  fireEvent.click(screen.getByRole("button", { name: "2. Equipment" }));
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Equipment arrangement" }));
  fireEvent.click(await screen.findByRole("option", { name: "Grid" }));
  field("Columns", 4);
  field("Left", 210); field("Top", 40); field("Width", 140); field("Height", 192);
  const preview = screen.getByRole("img", { name: /Screenshot with slot outlines/ });
  vi.spyOn(preview, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 358, bottom: 304, width: 358, height: 304, toJSON: () => ({}) });
  fireEvent.pointerDown(preview, { button: 0, clientX: 215, clientY: 45, pointerId: 1 });
  fireEvent.pointerMove(preview, { clientX: 105, clientY: 225, pointerId: 1 });
  fireEvent.pointerUp(preview, { clientX: 105, clientY: 225, pointerId: 1 });
  fireEvent.click(screen.getByRole("button", { name: "Find items" }));
  await screen.findByRole("region", { name: "Needs checking" });
  const call = vi.mocked(scanScreenshot).mock.calls[0];
  expect(call[1]).toBe("manual");
  expect(call[6]).toHaveLength(40);
  expect(call[6]?.filter(slot => slot.group === "inventory")[6]).toMatchObject({ x: 10, y: 50.4 });
  expect(call[6]?.find(slot => slot.group === "equipment" && slot.index === 0)).toMatchObject({ x: 100, y: 220 });
  expect(call[6]?.find(slot => slot.group === "equipment" && slot.index === 1)?.x).toBeGreaterThan(210);
  fireEvent.click(screen.getByRole("button", { name: "1. Inventory" }));
  expect((screen.getByRole("spinbutton", { name: "Left" }) as HTMLInputElement).value).toBe("10");
  expect(screen.queryByRole("region", { name: "Needs checking" })).toBeNull();
});
