import html2canvas from "html2canvas";

import { generateFileName } from "./generate-file-name";

export const exportAsImage = async (element: HTMLElement | null, preface: string): Promise<void> => {
  if (!element) {
    return;
  }

  await createCanvas(element, (blob: string) => {
    downloadImage(blob, preface);
  });
};

export const copyImageToClipboard = async (element: HTMLElement | null): Promise<void> => {
  if (!element) {
    return;
  }

  await createCanvas(element, (_imageBlobURL: string, canvas: HTMLCanvasElement) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          // TODO: Failure snackbar?
          return;
        }
        
        console.error(blob);
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]); 
      })
  });
};

const createCanvas = ( async (element: HTMLElement, callback: (imageBlobURL: string, canvas: HTMLCanvasElement) => void): Promise<void> => {
  const previousheight = element.style.height;

  const html = document.getElementsByTagName("html")[0];
  const body = document.getElementsByTagName("body")[0];

  let htmlWidth = html.clientWidth;
  let bodyWidth = body.clientWidth;

  const newWidth = element.scrollWidth - element.clientWidth;

  if (newWidth > element.clientWidth) {
    htmlWidth += newWidth;
    bodyWidth += newWidth;
  }

  html.style.width = htmlWidth + "px";
  body.style.width = bodyWidth + "px";

  element.style.height = element.clientHeight - 7 + "px";

  const canvas = await html2canvas(element, {
    allowTaint: true,
    logging: false,
    useCORS: true,
  });
  const imageBlobURL = canvas.toDataURL("image/png", 1.0);
  callback(imageBlobURL, canvas);
  // reset height
  element.style.height = previousheight;
})

const downloadImage = (blob: string, preface: string): void => {
  const fakeLink = window.document.createElement("a");
  fakeLink.setAttribute("style", "display: none");
  fakeLink.download = generateFileName(preface, "png");

  fakeLink.href = blob;

  document.body.appendChild(fakeLink);
  fakeLink.click();
  document.body.removeChild(fakeLink);

  fakeLink.remove();
};

