import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { HashRouter, MemoryRouter, useLocation } from "react-router-dom";
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
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState(null, "", "/"); });

function LayoutEditor() {
  const [layout, setLayout] = useInventoryLayout();
  const location = useLocation();
  return <>
    <output data-testid="location">{location.pathname}{location.search}</output>
    <InventoryLayoutSelect layout={layout} onChange={setLayout} />
    <PresetEditor layout={layout} />
  </>;
}

function setup(entry = "/preset") {
  const store = configureStore({ reducer: { preset: reducer, recentItem: recentItems } });
  const view = render(<MemoryRouter initialEntries={[entry]}><Provider store={store}><DndProvider backend={HTML5Backend}><LayoutEditor /></DndProvider></Provider></MemoryRouter>);
  return { ...view, store };
}

async function selectLayout(name: string) {
  const portraitToggle = screen.getByRole("checkbox", { name: "Portrait layout" });
  if (portraitToggle.checked !== name.startsWith("4 columns")) {
    fireEvent.click(portraitToggle);
  }
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

test.each(["4x7", "7x4"])("shared %s layout overrides the browser preference", (layout) => {
  localStorage.setItem("preset-maker:inventory-layout", layout === "4x7" ? "7x4" : "4x7");
  const { container } = setup(`/preset?layout=${layout}`);
  expect(container.querySelector(".preset-layout")?.getAttribute("data-inventory-layout")).toBe(layout);
});

test("ignores invalid shared layouts", () => {
  localStorage.setItem("preset-maker:inventory-layout", "4x7");
  const { container } = setup("/preset?layout=invalid");
  expect(container.querySelector(".preset-layout--4x7")).toBeTruthy();
});

test("restores the API redirect layout through the production hash router", () => {
  localStorage.setItem("preset-maker:inventory-layout", "7x4");
  window.history.replaceState(null, "", "/preset-maker/#/shared-preset?layout=4x7");
  const { result } = renderHook(() => useInventoryLayout(), { wrapper: HashRouter });
  expect(result.current[0]).toBe("4x7");
  act(() => result.current[1]("7x4"));
  expect(window.location.hash).toBe("#/shared-preset?layout=7x4");
  expect(result.current[0]).toBe("7x4");
});

test("switching layout updates the link while retaining other parameters", async () => {
  setup("/preset?layout=7x4&other=value");
  await selectLayout("4 columns");
  expect(screen.getByTestId("location").textContent).toBe("/preset?layout=4x7&other=value");
  await selectLayout("7 columns");
  expect(screen.getByTestId("location").textContent).toBe("/preset?layout=7x4&other=value");
});

test("uses the small-screen default only when there is no saved choice", () => {
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() } as any);
  const first = setup();
  expect(first.container.querySelector(".preset-layout--4x7")).toBeTruthy();
  first.unmount();
  localStorage.setItem("preset-maker:inventory-layout", "7x4");
  expect(setup().container.querySelector(".preset-layout--7x4")).toBeTruthy();
});

test("stacks portrait inventory and equipment panels on small screens", () => {
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() } as any);
  const { container } = setup();
  const panels = container.querySelector(".preset-layout__tall-slots");
  expect(panels).toBeTruthy();
  expect(panels?.querySelector(".preset-layout__inventory")).toBeTruthy();
  expect(panels?.querySelector(".preset-layout__equipment")).toBeTruthy();
});

test("still switches when local storage is blocked", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  const { container } = setup();
  await selectLayout("4 columns × 7 rows");
  expect(container.querySelector(".preset-layout--4x7")).toBeTruthy();
});
