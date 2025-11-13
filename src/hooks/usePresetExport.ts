// hooks/usePresetExport.ts

import html2canvas from "html2canvas";

export const usePresetExport = (presetName: string) => {
  const LOGGING = false;
  const log = (...a: any[]) => LOGGING && console.log("[Export]", ...a);

  const getEditorElement = () =>
    document.querySelector(".preset-editor__card") as HTMLElement | null;

  const ensureImagesLoaded = async (el: HTMLElement) => {
    const images = Array.from(el.querySelectorAll("img"));
    log("Waiting for images:", images.length);

    await Promise.all(
      images
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.onload = img.onerror = () => resolve(true);
            })
        )
    );
  };

  const renderCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const element = getEditorElement();
    if (!element) return null;

    log("Starting renderCanvas()");
    await ensureImagesLoaded(element);

    // Backup layout
    const originalPadding = element.style.padding;
    const originalMargin = element.style.marginBottom;

    const cardContent = element.querySelector(
      ".MuiCardContent-root"
    ) as HTMLElement | null;
    const originalCardContentPadding = cardContent?.style.padding;

    const addButtons = Array.from(
      element.querySelectorAll(
        ".relic-section__list-item--add, .familiar-section__list-item--add"
      )
    ) as HTMLElement[];

    const listRows = Array.from(
      element.querySelectorAll(
        ".relic-section__list-item, .familiar-section__list-item"
      )
    ) as HTMLElement[];

    const altSections = Array.from(
      element.querySelectorAll(
        ".relic-section__alternative, .familiar-section__alternative"
      )
    ) as HTMLElement[];

    // restore stores
    const hiddenRows: HTMLElement[] = [];
    const hiddenSections: HTMLElement[] = [];

    try {
      // Hide add buttons
      log("Hiding add buttons:", addButtons.length);
      addButtons.forEach((b) => (b.style.display = "none"));

      // Hide empty rows (no img + not add)
      log("Checking list rows:", listRows.length);
      listRows.forEach((row) => {
        const isAdd = row.classList.contains("relic-section__list-item--add") ||
                      row.classList.contains("familiar-section__list-item--add");

        const hasImage = !!row.querySelector("img");

        if (!isAdd && !hasImage) {
          log("Hiding empty row:", row);
          row.style.display = "none";
          hiddenRows.push(row);
        }
      });

      // Hide empty alt-sections
      log("Checking alt sections:", altSections.length);
      altSections.forEach((section) => {
        const list = section.querySelector(
          ".relic-section__list, .familiar-section__list"
        ) as HTMLElement | null;

        if (!list) {
          section.style.display = "none";
          hiddenSections.push(section);
          return;
        }

        const realItems = Array.from(list.children).filter((child) =>
          child.querySelector("img")
        );

        if (realItems.length === 0) {
          log("Hiding empty alt section:", section);
          section.style.display = "none";
          hiddenSections.push(section);
        }
      });

      // Tighten layout
      element.style.padding = "0px";
      element.style.marginBottom = "0px";
      if (cardContent) cardContent.style.padding = "0px";

      log("Running html2canvas…");
      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: null,
      });

      log("Canvas captured.");

      // Trim 16px bottom
      const trimmed = document.createElement("canvas");
      trimmed.width = canvas.width;
      trimmed.height = canvas.height - 16;

      const ctx = trimmed.getContext("2d");
      if (ctx) ctx.drawImage(canvas, 0, 0);

      return trimmed;
    } finally {
      log("Restoring DOM...");

      element.style.padding = originalPadding;
      element.style.marginBottom = originalMargin;
      if (cardContent) cardContent.style.padding = originalCardContentPadding ?? "";

      addButtons.forEach((b) => (b.style.display = ""));
      hiddenRows.forEach((r) => (r.style.display = ""));
      hiddenSections.forEach((s) => (s.style.display = ""));

      log("DOM fully restored.");
    }
  };

  const downloadImage = async () => {
    log("downloadImage() called");
    const canvas = await renderCanvas();
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `PRESET_${presetName.replaceAll(" ", "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    log("Download OK");
  };

  const copyImage = async () => {
    log("copyImage() called");
    const canvas = await renderCanvas();
    if (!canvas) return;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve)
    );
    if (blob)
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

    log("Copied OK");
  };

  return {
    copyImage,
    downloadImage,
    clipboardSupported: Boolean(navigator.clipboard?.write),
  };
};
