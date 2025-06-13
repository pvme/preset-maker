import fuzzysort from 'fuzzysort';
import React, { useCallback, useState } from 'react';

import Autocomplete, {
  type AutocompleteChangeDetails,
  type AutocompleteChangeReason,
  type AutocompleteRenderInputParams,
  type AutocompleteRenderOptionState
} from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { type FilterOptionsState } from '@mui/material/useAutocomplete';

import sortedFamiliars from '../../../data/sorted_familiars.json';
import { type FamiliarData } from '../../../types/familiar';
import './FamiliarSelectDialog.css';
import { useAppSelector } from '../../../redux/hooks';
import { selectPreset } from '../../../redux/store/reducers/preset-reducer';
import { type IndexedSelection, PrimaryOrAlternative } from '../../../types/util';

interface FamiliarSelectDialogProps {
  open: boolean
  indexedSelection: IndexedSelection
  handleClose: () => void
  handleSelection: (indexedSelection: IndexedSelection, familiar: FamiliarData | null) => void
}

const dialogBaseHeight = 130;
const dialogExpandedHeight = 400;

export const FamiliarSelectDialog = ({
  open,
  indexedSelection,
  handleClose,
  handleSelection
}: FamiliarSelectDialogProps): JSX.Element => {
  const {
    familiars
  } = useAppSelector(selectPreset);

  const [dialogHeight, setDialogHeight] = useState(
    // Initialize dialogHeight state with the value of the dialogBaseHeight
    // constant.
    dialogBaseHeight
  );

  const handleAutocompleteOpen = useCallback(() => {
    // Update the height of the Dialog box to fit the options dropdown of the Autocomplete component
    setDialogHeight(dialogExpandedHeight);
  }, [dialogExpandedHeight]);

  const handleAutocompleteClose = useCallback(() => {
    // Update the height of the Dialog box to the default height
    setDialogHeight(dialogBaseHeight);
  }, [dialogBaseHeight]);

  const disabledFamiliars = indexedSelection.primaryOrAlternative === PrimaryOrAlternative.Primary
    ? new Set(familiars.primaryFamiliars)
    : new Set(familiars.alternativeFamiliars);

  const filteredOptions = useCallback(
    (options: FamiliarData[], state: FilterOptionsState<FamiliarData>): FamiliarData[] => {
      if (state.inputValue.length === 0) {
        return options;
      }

      const filteredOptions = fuzzysort.go<FamiliarData>(
        state.inputValue,
        options,
        {
          limit: 100,
          threshold: -100,
          keys: ['name', 'label']
        }
      );

      return Array.from(filteredOptions).map((i) => i.obj);
    },
    []
  );

  const onChange = useCallback(
    (
      _event: React.SyntheticEvent,
      value: FamiliarData | null,
      _reason: AutocompleteChangeReason,
      _details?: AutocompleteChangeDetails<FamiliarData>
    ) => {
      if (value === null) {
        return;
      }

      handleSelection(indexedSelection, value);
      handleClose();
    },
    [indexedSelection]
  );

  const clearCell = useCallback(() => {
    handleSelection(indexedSelection, null);
    handleClose();
  }, [indexedSelection]);

  return (
    <Dialog
      classes={{
        paper: 'dialog__paper'
      }}
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>Assign a familiar</DialogTitle>
      <DialogContent
        className="dialog__content"
        sx={{
          height: dialogHeight
        }}
      >
        <Autocomplete
          className="dialog__auto-complete"
          disablePortal
          autoHighlight
          autoComplete
          options={sortedFamiliars}
          onOpen={handleAutocompleteOpen}
          onClose={handleAutocompleteClose}
          onChange={onChange}
          filterOptions={filteredOptions}
          getOptionDisabled={(option) => disabledFamiliars.has(option)}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField
              {...params}
              autoFocus
              label="Familiar list"
              inputProps={{
                ...params.inputProps,
                autoComplete: 'new-password' // disable autocomplete and autofill
              }}
            />
          )}
          renderOption={(
            props: React.HTMLAttributes<HTMLLIElement>,
            option: FamiliarData,
            _state: AutocompleteRenderOptionState
          ) => (
            <Box
              key={`option-${option.name}`}
              component="li"
              {...props}
            >
              <img
                id={`option-${option.image}`}
                key={`option-${option.image}`}
                className="dialog__list__image"
                loading="lazy"
                width={20}
                src={option.image}
                srcSet={`${option.image} 2x`}
                alt=""
              />
              {option.name}
            </Box>
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={clearCell}>
          Clear Familiar
        </Button>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
