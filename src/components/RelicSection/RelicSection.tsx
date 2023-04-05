import { useCallback, useState } from "react";
import Typography from "@mui/material/Typography/Typography";
import AddIcon from '@mui/icons-material/Add';

import relicIconPath from '../../assets/relic.png';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectPreset, setAlternativeRelic, setPrimaryRelic } from "../../redux/store/reducers/preset-reducer";

import { RelicData } from "../../types/relic";
import "./RelicSection.css";
import Tooltip from "@mui/material/Tooltip/Tooltip";
import { IndexedSelection, PrimaryOrAlternative } from "../../types/util";
import { RelicSelectDialog } from "../dialogs/RelicSelectDialogPopup/RelicSelectDialog";

export type RelicSectionListClickHandler = (
  _event: React.MouseEvent<HTMLDivElement>,
  index: number
) => void;

const RelicSectionList = ({ relics, onClick }: { relics: RelicData[], onClick: RelicSectionListClickHandler}) => {
  return (
    <div className="relic-section__list">
      {relics.map((relicData, index) => (
        <div
          key={relicData.label + index}
          className="d-flex flex-center relic-section__list-item"
          onClick={(event: React.MouseEvent<HTMLDivElement>) => {
            onClick(event, index);
          }}
        >
          {relicData.image.length > 0 && (
            <img className="relic-section__list-item-image" src={relicData.image}></img>
          )}
          <span className="relic-section__list-item-name">{relicData.name}</span>
          {relicData.energy && (
            <span className="relic-section__list-item-energy">&nbsp;({relicData.energy})</span>
          )}
        </div>
      ))}
    </div>
  )
};

export const RelicSection = () => {
  const dispatch = useAppDispatch();

  const {
    relics,
  } = useAppSelector(selectPreset);

  const visibleAlternativeRelics = relics.alternativeRelics.filter((relic) => relic.name);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [indexedSelection, setIndexedSelection] = useState({
    primaryOrAlternative: PrimaryOrAlternative.None,
    index: -1,
  });

  const openRelicDialog = useCallback(
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

  const closeRelicDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleRelicSelection = useCallback((indexedSelection: IndexedSelection, relic: RelicData) => {
    if (indexedSelection.primaryOrAlternative === PrimaryOrAlternative.Primary) {
      // Prevent duplicates.
      if (relics.primaryRelics.includes(relic)) {
        return;
      }

      dispatch(setPrimaryRelic({
        index: indexedSelection.index,
        value: relic,
      }));
    } else if (indexedSelection.primaryOrAlternative === PrimaryOrAlternative.Alternative) {
      // Prevent duplicates.
      if (relics.alternativeRelics.includes(relic)) {
        return;
      }

      dispatch(setAlternativeRelic({
        index: indexedSelection.index,
        value: relic,
      }));
    }

    setIndexedSelection({
      primaryOrAlternative: PrimaryOrAlternative.None,
      index: -1,
    });
    setDialogOpen(false);
  }, [relics, indexedSelection]);

  return (
    <div className="width-50">
      <Typography className="d-flex flex-center" variant="h6">
        <img
          className="m-8"
          width={24}
          height={24}
          src={relicIconPath}
        />
        Relics
      </Typography>
      <div>
        <RelicSectionList
          relics={relics.primaryRelics}
          onClick={(event, index) => {
            openRelicDialog(event, PrimaryOrAlternative.Primary, index);
          }}
        />
      </div>
      <div>
        <div>
          <strong>
            Alternative
          </strong>
        </div>
        <RelicSectionList
          relics={visibleAlternativeRelics}
          onClick={(event, index) => {
            openRelicDialog(event, PrimaryOrAlternative.Alternative, index);
          }}
        />
        <div
          className="d-flex flex-center relic-section__list-item relic-section__list-item--add"
          onClick={(event) => {
            openRelicDialog(event, PrimaryOrAlternative.Alternative, visibleAlternativeRelics.length);
          }}
        >
          <Tooltip title="Add alternative relic">
            <AddIcon
              className="cursor-pointer relic-section__add-relic"
              htmlColor="#646464"
            />
          </Tooltip>
        </div>
      </div>
      <RelicSelectDialog
        open={dialogOpen}
        indexedSelection={indexedSelection}
        handleClose={closeRelicDialog}
        handleSelection={handleRelicSelection}
      />
    </div>
  );
};
