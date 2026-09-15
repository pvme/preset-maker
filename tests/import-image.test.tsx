import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider, createTheme } from "@mui/material";
import { SnackbarProvider } from "notistack";
import ImportImageDialog from "../src/components/ImportImageDialog/ImportImageDialog";
import reducer from "../src/redux/store/reducers/preset-reducer";
import { readScreenshot, scanScreenshot, type Match } from "../src/imageImport/recognition";
import { loadEmojis } from "../src/emoji/loadEmojis";
import type { EmojiMaps } from "../src/emoji/types";

vi.mock("../src/imageImport/recognition", () => ({ readScreenshot: vi.fn(), scanScreenshot: vi.fn() }));
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
  { group: "inventory", index: 0, selected: "potion", confident: true, thumbnail: "data:image/png;base64,", candidates: [{ id: "potion", score: .1 }] },
  { group: "inventory", index: 1, selected: "__keep__", confident: false, thumbnail: "data:image/png;base64,", candidates: [{ id: "weapon", score: .5 }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  const image = new Image(); image.width = 358; image.height = 304;
  vi.mocked(readScreenshot).mockResolvedValue(image);
  vi.mocked(loadEmojis).mockResolvedValue(maps);
  vi.mocked(scanScreenshot).mockResolvedValue(structuredClone(results));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect: vi.fn(), drawImage: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), fill: vi.fn(), strokeRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  HTMLElement.prototype.scrollIntoView = vi.fn();
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
  fireEvent.click(await screen.findByRole("button", { name: "Find items" }));
  await screen.findByRole("region", { name: "Needs checking" });
}

test("uncertain matches come first; manual alias search and Apply update the preset", async () => {
  const { store, onClose } = setup();
  await uploadAndScan();
  expect(screen.getAllByRole("region").map(node => node.getAttribute("aria-label"))).toEqual(["Needs checking", "Confident matches"]);
  fireEvent.click(screen.getByRole("button", { name: "Search items for Inventory 2" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Search Inventory 2" }), { target: { value: "ovl" } });
  fireEvent.click(await screen.findByRole("option", { name: "Overload" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply items (2)" }));
  expect(store.getState().preset.inventorySlots.slice(0, 2)).toEqual([{ id: "potion" }, { id: "potion" }]);
  expect(onClose).toHaveBeenCalledOnce();
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
  fireEvent.click(await screen.findByRole("button", { name: "Find items" }));
  await waitFor(() => expect(scanScreenshot).toHaveBeenCalledOnce());
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Screenshot layout" }));
  fireEvent.click(await screen.findByRole("option", { name: "Inventory only (4 columns, 7 rows)" }));
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
