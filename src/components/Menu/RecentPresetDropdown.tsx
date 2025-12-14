import React, { useState } from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import CloudIcon from '@mui/icons-material/Cloud';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import { getRecentPresets, removeRecentPreset } from '../../storage/recent-presets';
import { PresetSummary } from '../../schemas/preset-summary';
import { LocalPresetStorage } from '../../storage/LocalPresetStorage';

interface Props {
  selected: string;
  onSelect: (preset: PresetSummary) => void;
  items: PresetSummary[];
  onRemoved: () => void;
}

export const RecentPresetDropdown = ({
  selected,
  onSelect,
  items,
  onRemoved,
}: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetToRemove, setPresetToRemove] = useState<PresetSummary | null>(null);
  const recent = items;

  const handleConfirmRemove = async () => {
    if (!presetToRemove) return;

    if (presetToRemove.source === 'local') {
      try {
        localStorage.removeItem(`preset:${presetToRemove.presetId}`);
      } catch (e) {
        console.warn('Failed to delete local preset', e);
      }
    }

    removeRecentPreset(presetToRemove.presetId);
    onRemoved();

    if (selected === presetToRemove.presetId) {
      onSelect({ presetId: '', presetName: '', source: 'local' });
    }

    setDialogOpen(false);
  };

  return (
    <>
      <FormControl size="small" sx={{ minWidth: 350 }}>
        <InputLabel id="recent-label">Recent Presets</InputLabel>
        <Select
          labelId="recent-label"
          value={selected || ''}
          onChange={(e) => {
            const item = recent.find((r: PresetSummary) => r.presetId === e.target.value);
            if (item) onSelect(item);
          }}
          label="Recent Presets"
          renderValue={(v) => {
            const match = recent.find((p: PresetSummary) => p.presetId === v);
            if (!match) return '';
            return (
              <Box display="flex" alignItems="center">
                {match.source === 'cloud' && <CloudIcon fontSize="small" />}
                <Box ml={match.source === 'cloud' ? 1 : 0}>{match.presetName.length > 50 ? `${match.presetName.slice(0, 47)}…` : match.presetName }</Box>
              </Box>
            );
          }}
        >
          {recent.length === 0 && <MenuItem disabled>No recent presets</MenuItem>}
          {recent.map((p: PresetSummary) => (
            <MenuItem key={p.presetId} value={p.presetId}>
              <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                <Box display="flex" alignItems="center">
                  {p.source === 'cloud' && <CloudIcon fontSize="small" />}
                  <Box ml={p.source === 'cloud' ? 1 : 0}>{p.presetName}</Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPresetToRemove(p);
                    setDialogOpen(true);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {presetToRemove?.source === 'local'
            ? 'Delete local preset?'
            : 'Remove cloud preset from recent list?'}
        </DialogTitle>
        <DialogContent>
          {presetToRemove?.source === 'local'
            ? 'This will permanently delete the preset from your browser. Are you sure?'
            : 'This will remove the cloud preset from your recent list. It will still be accessible via its URL.'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRemove} variant="contained" color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
