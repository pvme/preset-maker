import React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PresetMenu from "../src/components/PresetMenu/PresetMenu";

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));
vi.mock("@mui/icons-material", () => ({
  Save: () => null, Add: () => null, ArrowDropDown: () => null,
  Cloud: () => null, Link: () => null, ContentCopy: () => null,
  Image: () => null, FileDownload: () => null, FileUpload: () => null,
}));
vi.mock("notistack", () => ({ useSnackbar: () => ({ enqueueSnackbar: notify }) }));
vi.mock("../src/redux/hooks", () => ({ useAppSelector: () => ({ presetName: "Test" }) }));
vi.mock("../src/auth/AuthContext", () => ({ useAuth: () => ({ isLoggedIn: false }) }));
vi.mock("../src/storage/StorageModeContext", () => ({ useStorageMode: () => ({ mode: "cloud", isPresetEditable: false }) }));
vi.mock("../src/storage/PresetLoadContext", () => ({ usePresetLoad: () => ({ isPresetLoading: false }) }));
vi.mock("../src/storage/CloudPresetStorage", () => ({ CloudPresetStorage: {} }));
vi.mock("../src/components/PresetMenu/usePresetDirtyState", () => ({ usePresetDirtyState: () => ({ isDirty: false }) }));
vi.mock("../src/components/PresetMenu/usePresetSave", () => ({ usePresetSave: () => ({ isSaving: false }) }));
vi.mock("../src/components/PresetMenu/usePresetLoader", () => ({ usePresetLoader: () => ({}) }));
vi.mock("../src/components/PresetMenu/useRecentPresets", () => ({ useRecentPresets: () => ({ recentList: [] }) }));
vi.mock("../src/components/PresetMenu/usePresetJsonExport", () => ({ usePresetJsonExport: () => ({}) }));
vi.mock("../src/components/PresetMenu/usePresetJsonImport", () => ({ usePresetJsonImport: () => ({}) }));
vi.mock("../src/components/PresetMenu/RecentPresetDropdown", () => ({ RecentPresetDropdown: () => null }));
vi.mock("../src/components/SavePresetDialog/SavePresetDialog", () => ({ SavePresetDialog: () => null, SavePresetDialogState: {} }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

function setup(layout: "4x7" | "7x4", writeText = vi.fn().mockResolvedValue(undefined)) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener() {}, removeListener() {} });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<MemoryRouter initialEntries={["/test-preset"]}>
    <Routes><Route path="/:id" element={<PresetMenu layout={layout} onLayoutChange={() => {}} />} /></Routes>
  </MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  fireEvent.click(screen.getByText("Copy embed link"));
  return writeText;
}

test.each(["4x7", "7x4"] as const)("copies the displayed %s layout into the embed link", async layout => {
  const write = setup(layout);
  await waitFor(() => expect(notify).toHaveBeenCalledWith("Link copied", { variant: "success" }));
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  expect(write).toHaveBeenCalledWith(new URL(`embeds/test-preset/${layout}/`, base).href);
});

test("reports a clipboard failure without claiming the link was copied", async () => {
  setup("4x7", vi.fn().mockRejectedValue(new Error("denied")));
  await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.stringContaining("Could not copy"), { variant: "error" }));
  expect(notify).not.toHaveBeenCalledWith("Link copied", expect.anything());
});
