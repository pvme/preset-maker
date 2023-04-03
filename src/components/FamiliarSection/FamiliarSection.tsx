import { useCallback, useState } from "react";
import Typography from "@mui/material/Typography/Typography";
import AddIcon from '@mui/icons-material/Add';

import familiarIconPath from '../../assets/familiar.png';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectPreset, setAlternativeFamiliar, setPrimaryFamiliar } from "../../redux/store/reducers/preset-reducer";

import { FamiliarData } from "../../types/familiar";
import "./FamiliarSection.css";
import Tooltip from "@mui/material/Tooltip/Tooltip";
import { IndexedSelection, PrimaryOrAlternative } from "../../types/util";
import { FamiliarSelectDialog } from "../dialogs/FamiliarSelectDialog/FamiliarSelectDialog";

export type FamiliarSectionListClickHandler = (
  _event: React.MouseEvent<HTMLDivElement>,
  index: number
) => void;

const FamiliarSectionList = ({ familiars, onClick }: { familiars: FamiliarData[], onClick: FamiliarSectionListClickHandler}) => {
  return (
    <div className="familiar-section__list">
      {familiars.map((familiarData, index) => (
        <div
          key={familiarData.label + index}
          className="d-flex flex-center familiar-section__list-item"
          onClick={(event: React.MouseEvent<HTMLDivElement>) => {
            onClick(event, index);
          }}
        >
          {familiarData.image.length > 0 && (
            <img className="familiar-section__list-item-image" src={familiarData.image}></img>
          )}
          <span className="familiar-section__list-item-name">{familiarData.name}</span>
        </div>
      ))}
    </div>
  )
};

export const FamiliarSection = () => {
  const dispatch = useAppDispatch();

  const {
    familiars,
  } = useAppSelector(selectPreset);

  const visibleAlternativeFamiliars = familiars.alternativeFamiliars.filter((familiar) => familiar.name);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [indexedSelection, setIndexedSelection] = useState({
    primaryOrAlternative: PrimaryOrAlternative.None,
    index: -1,
  });

  const openFamiliarDialog = useCallback(
    (
      _event: React.MouseEvent<HTMLDivElement>,
      primaryOrAlternative: PrimaryOrAlternative,
      index: number,
    ) => {
      setIndexedSelection({
        primaryOrAlternative,
        index
      });
      setDialogOpen(true);
    },
    [indexedSelection]
  );

  const closeFamiliarDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleFamiliarSelection = useCallback((indexedSelection: IndexedSelection, familiar: FamiliarData) => {
    if (indexedSelection.primaryOrAlternative === PrimaryOrAlternative.Primary) {
      // Prevent duplicates.
      if (familiars.primaryFamiliars.includes(familiar)) {
        return;
      }

      dispatch(setPrimaryFamiliar({
        index: indexedSelection.index,
        value: familiar,
      }));
    } else if (indexedSelection.primaryOrAlternative === PrimaryOrAlternative.Alternative) {
      // Prevent duplicates.
      if (familiars.alternativeFamiliars.includes(familiar)) {
        return;
      }

      dispatch(setAlternativeFamiliar({
        index: indexedSelection.index,
        value: familiar,
      }));
    }

    setIndexedSelection({
      primaryOrAlternative: PrimaryOrAlternative.None,
      index: -1,
    });
    setDialogOpen(false);
  }, [familiars, indexedSelection]);

  return (
    <div className="width-50">
      <Typography className="d-flex flex-center" variant="h6">
        <img
          className="m-8"
          width={24}
          height={24}
          src={familiarIconPath}
        />
        Familiar
      </Typography>
      <div>
        <FamiliarSectionList
          familiars={familiars.primaryFamiliars}
          onClick={(event, index) => {
            openFamiliarDialog(event, PrimaryOrAlternative.Primary, index);
          }}
        />
      </div>
      <div>
        <div>
          <strong>
            Alternative
          </strong>
        </div>
        <FamiliarSectionList
          familiars={visibleAlternativeFamiliars}
          onClick={(event, index) => {
            openFamiliarDialog(event, PrimaryOrAlternative.Alternative, index);
          }}
        />
        <div
          className="d-flex flex-center familiar-section__list-item familiar-section__list-item--add"
          onClick={(event) => {
            openFamiliarDialog(event, PrimaryOrAlternative.Alternative, visibleAlternativeFamiliars.length);
          }}
        >
          <Tooltip title="Add alternative familiar">
            <AddIcon
              className="cursor-pointer familiar-section__add-familiar"
              htmlColor="#646464"
            />
          </Tooltip>
        </div>
      </div>
      <FamiliarSelectDialog
        open={dialogOpen}
        indexedSelection={indexedSelection}
        handleClose={closeFamiliarDialog}
        handleSelection={handleFamiliarSelection}
      />
    </div>
  );
};
