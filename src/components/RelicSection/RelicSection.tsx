import React, { useCallback, useState } from 'react';
import Typography from '@mui/material/Typography/Typography';
import AddIcon from '@mui/icons-material/Add';

import relicIconPath from '../../assets/relic.png';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectPreset, setAlternativeRelic, setPrimaryRelic } from '../../redux/store/reducers/preset-reducer';

import { type RelicData } from '../../types/relic';
import './RelicSection.css';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import { type IndexedSelection, PrimaryOrAlternative } from '../../types/util';
import { RelicSelectDialog } from '../dialogs/RelicSelectDialogPopup/RelicSelectDialog';
import { isMobile } from '../../utility/window-utils';

export type RelicSectionListClickHandler = (
  _event: React.MouseEvent<HTMLDivElement>,
  index: number
) => void;

const isMobileScreen = isMobile();

const RelicSectionList = ({ relics, onClick }: { relics: RelicData[], onClick: RelicSectionListClickHandler }): JSX.Element => {
  const onRelicSelect = useCallback((event: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (isMobileScreen) {
      return;
    }

    onClick(event, index);
  }, [onClick]);

  return (
    <div className="relic-section__list">
      {relics.map((relicData, index) => (
        <div
          key={`${relicData.label}${index}`}
          className="d-flex flex-center relic-section__list-item"
          onClick={(event) => { onRelicSelect(event, index); }}
          title={relicData.description}
        >
          {relicData.image.length > 0 && (
            <img className="relic-section__list-item-image" src={relicData.image}></img>
          )}
          <span className="relic-section__list-item-name">{relicData.name}</span>
          {((relicData?.energy ?? 0) > 0) && (
            <span className="relic-section__list-item-energy">&nbsp;({relicData.energy})</span>
          )}
        </div>
      ))}
    </div>
  );
};

export const RelicSection = (): JSX.Element => {
  const dispatch = useAppDispatch();

  const {
    relics
  } = useAppSelector(selectPreset);

  const primaryRelics = relics.primaryRelics;
  const visibleAlternativeRelics = relics.alternativeRelics.filter((r): r is NonNullable<typeof r> => r !== null && !!r.name);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [indexedSelection, setIndexedSelection] = useState({
    primaryOrAlternative: PrimaryOrAlternative.None,
    index: -1
  });

  const openRelicDialog = useCallback(
    (
      _event: React.MouseEvent<HTMLDivElement>,
      primaryOrAlternative: PrimaryOrAlternative,
      index: number
    ) => {
      if (isMobileScreen) {
        return;
      }

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

  const handleRelicSelection = useCallback((indexedSelection: IndexedSelection, relic: RelicData | null) => {
    if (indexedSelection.primaryOrAlternative === PrimaryOrAlternative.Primary) {
      // Prevent duplicates.
      if ((relic != null) && relics.primaryRelics.includes(relic)) {
        return;
      }

      dispatch(setPrimaryRelic({
        index: indexedSelection.index,
        value: relic
      }));
    } else if (indexedSelection.primaryOrAlternative === PrimaryOrAlternative.Alternative) {
      // Prevent duplicates.
      if ((relic != null) && relics.alternativeRelics.includes(relic)) {
        return;
      }

      dispatch(setAlternativeRelic({
        index: indexedSelection.index,
        value: relic
      }));
    }

    setIndexedSelection({
      primaryOrAlternative: PrimaryOrAlternative.None,
      index: -1
    });
    setDialogOpen(false);
  }, [relics, indexedSelection]);

  return (
    <div className="d-flex flex-col width-50">
      <Typography className="d-flex flex-center" variant="h6">
        <img
          className="m-8"
          width={24}
          height={24}
          src={relicIconPath}
        />
        Relics
      </Typography>
      <div className="d-flex flex-col">
        {primaryRelics.map((relic, i) => (
          <div
            key={i}
            className="d-flex flex-center relic-section__list-item"
            onClick={(e) => openRelicDialog(e, PrimaryOrAlternative.Primary, i)}
          >
            {relic.label
              ? <>
                  {relic.image && <img className="relic-section__list-item-image" src={relic.image} />}
                  <span className="relic-section__list-item-name">{relic.name}</span>
                  {(relic.energy ?? 0) > 0 && (
                    <span className="relic-section__list-item-energy">
                      &nbsp;({relic.energy})
                    </span>
                  )}
                </>
              : (
                  <Tooltip title="Add relic">
                    <AddIcon
                      className="cursor-pointer relic-section__add-relic"
                      htmlColor="#646464"
                    />
                  </Tooltip>
                )
            }
          </div>
        ))}
      </div>
      <div className="mt-auto relic-section__alternative">
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
