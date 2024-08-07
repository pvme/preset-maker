import html2canvas from 'html2canvas';

import { generateFileName } from './generate-file-name';

interface ImageExportOptions {
  hiddenElements?: string[]
  elementsToShow?: string[]
};

/**
 * Converts an HTMLElement to a Base64 image.
 * @param element The element to convert.
 * @returns Base64 encoded image as a string.
 */
export const getImageFromElement = async (element: HTMLElement | null): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
    if (element == null) {
      reject(new Error('Null element'));
      return;
    }

    createCanvas(element, {}, (blob: string) => {
      resolve(blob);
    }).catch((e) => {
      reject(e);
    });
  });
};

export const exportAsImage = async (element: HTMLElement | null, preface: string): Promise<void> => {
  if (element == null) {
    return;
  }

  await createCanvas(element, {}, (blob: string) => {
    downloadImage(blob, preface);
  });
};

export const copyImageToClipboard = async (element: HTMLElement | null, options: ImageExportOptions, { onSuccess, onError }: {
  onSuccess: () => void
  onError: () => void
}): Promise<void> => {
  if (element == null) {
    onError();
    return;
  }

  await createCanvas(element, options, (_imageBlobURL: string, canvas: HTMLCanvasElement) => {
    canvas.toBlob((blob) => {
      if (blob == null) {
        onError();
        return;
      }

      const item = new ClipboardItem({ 'image/png': blob });
      void navigator.clipboard.write([item]);
      onSuccess();
    });
  });
};

const createCanvas = async (element: HTMLElement, options: ImageExportOptions, callback: (imageBlobURL: string, canvas: HTMLCanvasElement) => void): Promise<void> => {
  const previousHeight = element.style.height;

  const html = document.getElementsByTagName('html')[0];
  const body = document.getElementsByTagName('body')[0];

  let htmlWidth = html.clientWidth;
  let bodyWidth = body.clientWidth;

  const newWidth = element.scrollWidth - element.clientWidth;

  if (newWidth > element.clientWidth) {
    htmlWidth += newWidth;
    bodyWidth += newWidth;
  }

  html.style.width = `${htmlWidth}px`;
  body.style.width = `${bodyWidth}px`;

  toggleElementDisplay(options?.hiddenElements ?? [], false);
  toggleElementDisplay(options?.elementsToShow ?? [], true);

  // Adjust the height to remove a white border at the bottom (not
  // sure where its coming from).
  element.style.height = `${element.clientHeight - 5}px`;

  const canvas = await html2canvas(element, {
    allowTaint: true,
    logging: false,
    useCORS: true
  });
  const imageBlobURL = canvas.toDataURL('image/png', 1.0);
  callback(imageBlobURL, canvas);

  // Restore the DOM
  element.style.height = previousHeight;
  // This needs a delay because the clipboard will cause the DOM not
  // not be focused.
  await new Promise((resolve) => {
    setTimeout(() => {
      toggleElementDisplay(options?.hiddenElements ?? [], true);
      toggleElementDisplay(options?.elementsToShow ?? [], false);
      resolve(true);
    }, 500);
  });
};

const downloadImage = (blob: string, preface: string): void => {
  const fakeLink = window.document.createElement('a');
  fakeLink.setAttribute('style', 'display: none');
  fakeLink.download = generateFileName(preface, 'png');

  fakeLink.href = blob;

  document.body.appendChild(fakeLink);
  fakeLink.click();
  document.body.removeChild(fakeLink);

  fakeLink.remove();
};

const toggleElementDisplay = (classNames: string[], shouldDisplay: boolean): void => {
  classNames.forEach(className => {
    const element = document.querySelector(className) as HTMLElement;
    element.style.display = shouldDisplay ? 'block' : 'none';
  });
};
