import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PresetEditor } from "../src/components/PresetEditor/PresetEditor";
import { InventoryLayoutSelect } from "../src/components/PresetMenu/InventoryLayoutSelect";
import { useInventoryLayout } from "../src/hooks/useInventoryLayout";
import reducer, { applyImageImport } from "../src/redux/store/reducers/preset-reducer";
import recentItems from "../src/redux/store/reducers/recent-item-reducer";

vi.mock("../src/hooks/useEmojiMap", () => ({ useEmojiMap: () => null }));
vi.mock("../src/components/EmojiSelectDialog/EmojiSelectDialog", () => ({ EmojiSelectDialog: () => null }));
vi.mock("../src/storage/StorageModeContext", () => ({
  useStorageMode: () => ({ isPresetEditable: false }),
}));

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function LayoutEditor() {
  const [layout, setLayout] = useInventoryLayout();
  return <><InventoryLayoutSelect layout={layout} onChange={setLayout} /><PresetEditor layout={layout} /></>;
}

function setup() {
  const store = configureStore({ reducer: { preset: reducer, recentItem: recentItems } });
  const view = render(<Provider store={store}><DndProvider backend={HTML5Backend}><LayoutEditor /></DndProvider></Provider>);
  return { ...view, store };
}

async function selectLayout(name: string) {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Inventory layout" }));
  fireEvent.click(await screen.findByRole("option", { name }));
}

test("switches a read-only preset between both arrangements without changing imported items or slot state", async () => {
  const { container, store } = setup();
  act(() => { store.dispatch(applyImageImport([{ group: "inventory", index: 4, selected: "overload" }])); });
  const before = store.getState().preset;
  const slots = () => Array.from(container.querySelectorAll<HTMLElement>(".preset-slots__slot--inventory"));
  expect(slots()).toHaveLength(28);
  expect(slots()[4].style.top).toBe(slots()[0].style.top);
  await selectLayout("4 columns × 7 rows");
  expect(slots()).toHaveLength(28);
  expect(slots()[4].style.left).toBe(slots()[0].style.left);
  expect(slots()[4].style.top).not.toBe(slots()[0].style.top);
  expect(container.querySelectorAll(".preset-slots__slot--equipment")).toHaveLength(12);
  expect(store.getState().preset).toBe(before);
  await selectLayout("7 columns × 4 rows");
  expect(slots()[4].style.top).toBe(slots()[0].style.top);
  expect(store.getState().preset).toBe(before);
});

test("remembers the explicit layout across mounts", async () => {
  const first = setup();
  await selectLayout("4 columns × 7 rows");
  first.unmount();
  const second = setup();
  expect(second.container.querySelector(".preset-layout")?.getAttribute("data-inventory-layout")).toBe("4x7");
});

test("uses the small-screen default only when there is no saved choice", () => {
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() } as any);
  const first = setup();
  expect(first.container.querySelector(".preset-layout--4x7")).toBeTruthy();
  first.unmount();
  localStorage.setItem("preset-maker:inventory-layout", "7x4");
  expect(setup().container.querySelector(".preset-layout--7x4")).toBeTruthy();
});

test("still switches when local storage is blocked", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  const { container } = setup();
  await selectLayout("4 columns × 7 rows");
  expect(container.querySelector(".preset-layout--4x7")).toBeTruthy();
});
