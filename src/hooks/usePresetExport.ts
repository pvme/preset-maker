import html2canvas from 'html2canvas';

export const usePresetExport = (presetName: string) => {
  const getEditorElement = () =>
    document.querySelector('.preset-editor__card') as HTMLElement | null;

  const ensureImagesLoaded = async (element: HTMLElement) => {
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = () => resolve(true);
        }))
    );
  };

  const renderCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const element = getEditorElement();
    if (!element) return null;

    await ensureImagesLoaded(element);

    // Backup styles
    const originalPadding = element.style.padding;
    const originalMargin = element.style.marginBottom;
    const cardContent = element.querySelector('.MuiCardContent-root') as HTMLElement | null;
    const originalCardContentPadding = cardContent?.style.padding;

    // Remove padding/margin
    element.style.padding = '0px';
    element.style.marginBottom = '0px';
    if (cardContent) cardContent.style.padding = '0px';

    // Step 1: Hide all add buttons
    const addButtons = Array.from(element.querySelectorAll(
      '.relic-section__list-item--add, .familiar-section__list-item--add'
    )) as HTMLElement[];
    addButtons.forEach(el => el.style.display = 'none');

    // Step 2 & 3: Hide entire .alternative section if list has no real items
    const altSections = Array.from(
      element.querySelectorAll(
        '.relic-section__alternative, .familiar-section__alternative'
      )
    ) as HTMLElement[];

    const hiddenSections: HTMLElement[] = [];

    altSections.forEach(section => {
      const list = section.querySelector('.relic-section__list, .familiar-section__list') as HTMLElement | null;
      if (!list) return;

      const realItems = Array.from(list.children).filter(child =>
        child.classList.contains('relic-section__list-item') ||
        child.classList.contains('familiar-section__list-item')
      );

      if (realItems.length === 0) {
        section.style.display = 'none';
        hiddenSections.push(section);
      }
    });

    // Render canvas
    const canvas = await html2canvas(element, {
      useCORS: true,
      backgroundColor: null
    });

    // Trim bottom 16px
    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = canvas.width;
    trimmedCanvas.height = canvas.height - 16;
    const ctx = trimmedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);
    }

    // Restore styles
    element.style.padding = originalPadding;
    element.style.marginBottom = originalMargin;
    if (cardContent && originalCardContentPadding !== undefined)
      cardContent.style.padding = originalCardContentPadding;

    addButtons.forEach(el => el.style.display = '');
    hiddenSections.forEach(section => section.style.display = '');

    return trimmedCanvas;
  };

  const copyImage = async () => {
    const canvas = await renderCanvas();
    if (!canvas) return;

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve));
    if (blob) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    }
  };

  const downloadImage = async () => {
    const canvas = await renderCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `PRESET_${presetName.replaceAll(' ', '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return {
    copyImage,
    downloadImage,
    clipboardSupported: Boolean(navigator.clipboard?.write),
  };
};
