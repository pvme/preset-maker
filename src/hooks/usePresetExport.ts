import html2canvas from "html2canvas";

export async function renderPresetCanvas(): Promise<HTMLCanvasElement> {
  const element = document.querySelector<HTMLElement>(".preset-layout");
  if (!element) throw new Error("The preset is not ready to export.");

  await Promise.all(Array.from(element.querySelectorAll("img")).map(async (image) => {
    await image.decode();
  }));
  await document.fonts.ready;

  return html2canvas(element, {
    useCORS: true,
    backgroundColor: null,
    scale: 2,
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    onclone: (_document, clonedElement) => {
      clonedElement.classList.add("preset-layout--export");
      clonedElement.querySelectorAll(".preset-extras__add").forEach((control) => control.remove());
    },
  });
}

export const usePresetExport = (presetName: string) => {
  const downloadImage = async () => {
    const canvas = await renderPresetCanvas();
    const link = document.createElement("a");
    link.download = `PRESET_${presetName.replaceAll(" ", "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyImage = async () => {
    const canvas = await renderPresetCanvas();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not create the preset image.");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  };

  return { copyImage, downloadImage, clipboardSupported: Boolean(navigator.clipboard?.write) };
};
