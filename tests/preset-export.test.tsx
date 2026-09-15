import { afterEach, expect, test, vi } from "vitest";
import html2canvas from "html2canvas";
import { renderPresetCanvas } from "../src/hooks/usePresetExport";

vi.mock("html2canvas", () => ({ default: vi.fn() }));
afterEach(() => { document.body.innerHTML = ""; vi.restoreAllMocks(); vi.clearAllMocks(); });

test.each(["4x7", "7x4"])("exports the complete %s layout and cleans only the clone", async (layout) => {
  document.body.innerHTML = `<div class="preset-editor__toolbar">Layout</div><div class="preset-layout preset-layout--${layout}"><img /><svg class="preset-extras__add"></svg></div>`;
  const element = document.querySelector<HTMLElement>(".preset-layout")!;
  Object.defineProperties(element, { scrollWidth: { value: 472 }, scrollHeight: { value: 517 } });
  const decode = vi.fn().mockResolvedValue(undefined);
  element.querySelector("img")!.decode = decode;
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
  const canvas = document.createElement("canvas");
  vi.mocked(html2canvas).mockImplementation(async (target, options) => {
    expect(decode).toHaveBeenCalledOnce();
    expect(target).toBe(element);
    expect(options).toMatchObject({ width: 472, height: 517, scale: 2 });
    const clone = element.cloneNode(true) as HTMLElement;
    options?.onclone?.(document, clone);
    expect(clone.classList.contains("preset-layout--export")).toBe(true);
    expect(clone.querySelector(".preset-extras__add")).toBeNull();
    expect(element.querySelector(".preset-extras__add")).not.toBeNull();
    expect(element.classList.contains("preset-layout--export")).toBe(false);
    return canvas;
  });
  expect(await renderPresetCanvas()).toBe(canvas);
});

test("rejects incomplete images before creating an export", async () => {
  document.body.innerHTML = '<div class="preset-layout"><img /></div>';
  document.querySelector("img")!.decode = vi.fn().mockRejectedValue(new Error("Image unavailable"));
  await expect(renderPresetCanvas()).rejects.toThrow("Image unavailable");
  expect(html2canvas).not.toHaveBeenCalled();
});
