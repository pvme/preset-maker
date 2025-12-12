// src/components/RelicSection/RelicSection.tsx
import React, { useCallback, useState } from "react";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import Tooltip from "@mui/material/Tooltip";

import relicIconPath from "../../assets/relic.png";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectPreset,
  setPrimaryRelic,
  setAlternativeRelic,
} from "../../redux/store/reducers/preset-reducer";

import { type Relic as RelicData } from "../../schemas/relic";
import { type IndexedSelection, PrimaryOrAlternative } from "../../schemas/util";

import { EmojiSelectDialog } from "../EmojiSelectDialog/EmojiSelectDialog";
import { useEmojiMap } from "../../hooks/useEmojiMap";
import { isMobile } from "../../utility/window-utils";

import "./RelicSection.css";

const isMobileScreen = isMobile();

export const RelicSection = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { relics } = useAppSelector(selectPreset);

  const maps = useEmojiMap();   // hooks must run unconditionally

  const primary = relics.primaryRelics;
  const alt = relics.alternativeRelics.filter(r => r && r.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selection, setSelection] = useState<IndexedSelection>({
    primaryOrAlternative: PrimaryOrAlternative.None,
    index: -1,
  });

  const openDialog = useCallback(
    (type: PrimaryOrAlternative, index: number) => {
      if (isMobileScreen) return;
      setSelection({ primaryOrAlternative: type, index });
      setDialogOpen(true);
    },
    []
  );

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const onSelect = useCallback(
    (ids: string[]) => {
      const id = ids[0] ?? "";
      const relic: RelicData | null = id ? { id } : null;

      if (selection.primaryOrAlternative === PrimaryOrAlternative.Primary) {
        dispatch(setPrimaryRelic({ index: selection.index, value: relic }));
      } else {
        dispatch(setAlternativeRelic({ index: selection.index, value: relic }));
      }

      setSelection({ primaryOrAlternative: PrimaryOrAlternative.None, index: -1 });
      setDialogOpen(false);
    },
    [dispatch, selection]
  );

  //
  // Maps may not be ready → show empty but stable structure
  //
  const safeGet = (id: string) => maps?.get(id);
  const safeUrl = (id: string) => maps?.getUrl(id) ?? "";

  return (
    <div className="d-flex flex-col width-50">
      <Typography className="d-flex flex-center" variant="h6">
        <img className="m-8" width={24} height={24} src={relicIconPath} />
        Relics
      </Typography>

      {/* PRIMARY RELICS */}
      <div className="d-flex flex-col">
        {primary.map((r, i) => {
          const entry = r.id ? safeGet(r.id) : undefined;

          if (!entry) {
            return (
              <div
                key={i}
                className="d-flex flex-center relic-section__list-item"
                onClick={() => openDialog(PrimaryOrAlternative.Primary, i)}
              >
                <Tooltip title="Add relic">
                  <AddIcon className="cursor-pointer relic-section__add-relic" htmlColor="#646464" />
                </Tooltip>
              </div>
            );
          }

          const url = safeUrl(entry.id);

          return (
            <div
              key={i}
              className="d-flex flex-center relic-section__list-item"
              onClick={() => openDialog(PrimaryOrAlternative.Primary, i)}
            >
              <img className="relic-section__list-item-image" src={url} />
              <span className="relic-section__list-item-name">{entry.name}</span>
            </div>
          );
        })}
      </div>

      {/* ALTERNATIVE RELICS */}
      <div className="mt-auto relic-section__alternative">
        <div className="relic-section__alternative__title">Alternative</div>

        {alt.map((r, i) => {
          const entry = safeGet(r.id);
          if (!entry) return null;

          const url = safeUrl(entry.id);

          return (
            <div
              key={i}
              className="d-flex flex-center relic-section__list-item"
              onClick={() => openDialog(PrimaryOrAlternative.Alternative, i)}
            >
              <img className="relic-section__list-item-image" src={url} />
              <span className="relic-section__list-item-name">{entry.name}</span>
            </div>
          );
        })}

        {/* Add alternative */}
        <div
          className="d-flex flex-center relic-section__list-item relic-section__list-item--add"
          onClick={() => openDialog(PrimaryOrAlternative.Alternative, alt.length)}
        >
          <Tooltip title="Add alternative relic">
            <AddIcon className="cursor-pointer relic-section__add-relic" htmlColor="#646464" />
          </Tooltip>
        </div>
      </div>

      <EmojiSelectDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSelect={onSelect}
        slotType={"relic"}
        slotKey=""
        slotIndex={selection.index}
        selectedIndices={[`${selection.index}`]}
        recentlySelected={[]}
      />
    </div>
  );
};
