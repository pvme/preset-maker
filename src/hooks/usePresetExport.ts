// src/hooks/usePresetExport.ts

import { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useAppSelector } from '../redux/hooks';
import { selectPreset } from '../redux/store/reducers/preset-reducer';
import { uploadPreset } from '../api/upload-preset';
import { canCopyImagesToClipboard } from 'copy-image-clipboard';
import { useParams } from 'react-router-dom';
import { getPresetImageUrl } from '../api/upload-preset';

export const usePresetExport = () => {
  const { enqueueSnackbar } = useSnackbar();
  const preset = useAppSelector(selectPreset);
  const { id } = useParams<{ id?: string }>();
  const clipboardSupported = canCopyImagesToClipboard();

  const fetchImageUrl = useCallback(async (): Promise<string> => {
    if (!id) {
      throw new Error('No preset ID provided');
    }
    // Re-use uploadPreset: server will render PNG, upload it, and return its URL
    const imageUrl = await getPresetImageUrl(preset, id);
    if (!imageUrl) {
      throw new Error('No image URL returned from server');
    }
    return imageUrl;
  }, [id, preset]);

  const exportBreakdown = useCallback(async () => {
    try {
      const imageUrl = await fetchImageUrl();
      // Fetch the image as a blob, then download via blob URL
      const res = await fetch(imageUrl, {
        // in dev, the emulator accepts this as a privileged token
        headers: process.env.NODE_ENV === 'development'
          ? { Authorization: 'Bearer owner' }
          : undefined
      });
      if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `BREAK_DOWN_${preset.presetName.replaceAll(' ', '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      enqueueSnackbar(`Download failed: ${err.message}`, { variant: 'error' });
    }
  }, [fetchImageUrl, preset.presetName, enqueueSnackbar]);

  const copyBreakdownToClipboard = useCallback(async () => {
    if (!clipboardSupported) {
      enqueueSnackbar('Clipboard API not supported in this browser.', { variant: 'error' });
      return;
    }
    try {
      const imageUrl = await fetchImageUrl();
      const res = await fetch(imageUrl, {
        headers: process.env.NODE_ENV === 'development'
          ? { Authorization: 'Bearer owner' }
          : undefined
      });
      if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      enqueueSnackbar('Copied image to clipboard', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(`Copy failed: ${err.message}`, { variant: 'error' });
    }
  }, [fetchImageUrl, clipboardSupported, enqueueSnackbar]);

  return {
    exportBreakdown,
    copyBreakdownToClipboard,
    clipboardSupported,
  };
};
