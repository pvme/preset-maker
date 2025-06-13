import { useRef, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useAppSelector } from '../redux/hooks';
import { selectPreset } from '../redux/store/reducers/preset-reducer';
import { exportAsImage, copyImageToClipboard } from '../utility/export-to-png';
import { canCopyImagesToClipboard } from 'copy-image-clipboard';

export const usePresetExport = () => {
  const exportRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const clipboardSupported = canCopyImagesToClipboard();
  const { presetName } = useAppSelector(selectPreset);

  const exportBreakdown = useCallback(async () => {
    if (exportRef.current) {
      await exportAsImage(
        exportRef.current,
        `BREAK_DOWN_${presetName.replaceAll(' ', '_')}`
      );
    }
  }, [presetName]);

  const copyBreakdownToClipboard = useCallback(async () => {
    if (exportRef.current) {
      await copyImageToClipboard(exportRef.current, {}, {
        onSuccess: () => enqueueSnackbar('Copied image to clipboard', { variant: 'success' }),
        onError: () => enqueueSnackbar('Failed to copy image to clipboard', { variant: 'error' }),
      });
    }
  }, [enqueueSnackbar]);

  return {
    exportRef,
    exportBreakdown,
    copyBreakdownToClipboard,
    clipboardSupported,
  };
};
