import { useCallback, useState } from "react";
import Typography from "@mui/material/Typography/Typography";
import AddIcon from '@mui/icons-material/Add';

import relicIconPath from '../../assets/relic.png';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectPreset, setAlternativeRelic, setPrimaryRelic } from "../../redux/store/reducers/preset-reducer";

import { RelicData } from "../../types/relics";
import { RelicSelectDialogPopup } from "../RelicSelectDialogPopup/RelicSelectDialogPopup";
import "./RelicSection.css";
import Tooltip from "@mui/material/Tooltip/Tooltip";
import IconButton from "@mui/material/IconButton/IconButton";

export enum RelicType {
  None,
  Primary,
  Alternative
};

interface RelicSectionProps {
  // Nothing yet.
}

export interface SelectionDetails {
  relicType: RelicType;
  index: number;
}

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
        </div>
      ))}
    </div>
  )
};

export const RelicSection = ({}: RelicSectionProps) => {
  const dispatch = useAppDispatch();

  const {
    relics,
  } = useAppSelector(selectPreset);

  const visibleAlternativeRelics = relics.alternativeRelics.filter((relic) => relic.name);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectionDetails, setSelectionDetails] = useState({
    relicType: RelicType.None,
    index: -1,
  });

  const openRelicDialog = useCallback(
    (
      _event: React.MouseEvent<HTMLDivElement>,
      relicType: RelicType,
      index: number,
    ) => {
      setSelectionDetails({
        relicType,
        index
      });
      setDialogOpen(true);
    },
    [selectionDetails]
  );

  const closeRelicDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleRelicSelection = useCallback((selectionDetails: SelectionDetails, relic: RelicData) => {
    if (selectionDetails.relicType === RelicType.Primary) {
      // Prevent duplicates.
      if (relics.primaryRelics.includes(relic)) {
        return;
      }

      dispatch(setPrimaryRelic({
        index: selectionDetails.index,
        value: relic,
      }));
    } else if (selectionDetails.relicType === RelicType.Alternative) {
      // Prevent duplicates.
      if (relics.alternativeRelics.includes(relic)) {
        return;
      }

      dispatch(setAlternativeRelic({
        index: selectionDetails.index,
        value: relic,
      }));
    }

    setSelectionDetails({
      relicType: RelicType.None,
      index: -1,
    });
    setDialogOpen(false);
  }, [relics, selectionDetails]);

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
            openRelicDialog(event, RelicType.Primary, index);
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
            openRelicDialog(event, RelicType.Alternative, index);
          }}
        />
        <div
          className="d-flex flex-center relic-section__list-item relic-section__list-item--add"
          onClick={(event) => {
            openRelicDialog(event, RelicType.Alternative, visibleAlternativeRelics.length);
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
      <RelicSelectDialogPopup
        open={dialogOpen}
        selectionDetails={selectionDetails}
        handleClose={closeRelicDialog}
        handleSelection={handleRelicSelection}
      />
    </div>
  );
};
