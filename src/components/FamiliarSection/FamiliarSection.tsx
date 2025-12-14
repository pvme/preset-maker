// src/components/FamiliarSection/FamiliarSection.tsx
import React, { useCallback, useState } from "react";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import Tooltip from "@mui/material/Tooltip";

import familiarIconPath from "../../assets/familiar.png";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectPreset,
  setPrimaryFamiliar,
  setAlternativeFamiliar,
} from "../../redux/store/reducers/preset-reducer";

import { type Familiar as FamiliarData } from "../../schemas/familiar";
import { type IndexedSelection, PrimaryOrAlternative } from "../../schemas/util";

import { EmojiSelectDialog } from "../EmojiSelectDialog/EmojiSelectDialog";
import { useEmojiMap } from "../../hooks/useEmojiMap";
import { isMobile } from "../../utility/window-utils";

import "./FamiliarSection.css";

const isMobileScreen = isMobile();

export const FamiliarSection = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { familiars } = useAppSelector(selectPreset);

  const maps = useEmojiMap();  // must always run
  const primary = familiars.primaryFamiliars;
  const alt = familiars.alternativeFamiliars.filter(f => f && f.id);

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
      const fam: FamiliarData | null = id ? { id } : null;

      if (selection.primaryOrAlternative === PrimaryOrAlternative.Primary) {
        dispatch(setPrimaryFamiliar({ index: selection.index, value: fam }));
      } else {
        dispatch(setAlternativeFamiliar({ index: selection.index, value: fam }));
      }

      setSelection({ primaryOrAlternative: PrimaryOrAlternative.None, index: -1 });
      setDialogOpen(false);
    },
    [dispatch, selection]
  );

  //
  // Safe lookups — maps may be null initially
  //
  const safeGet = (id: string) => maps?.get(id);
  const safeUrl = (id: string) => maps?.getUrl(id) ?? "";

  return (
    <div className="width-50 familiar-section">
      <Typography className="d-flex flex-center" variant="h6">
        <img className="m-8" width={24} height={24} src={familiarIconPath} />
        Familiar
      </Typography>

      {/* PRIMARY */}
      <div className="familiar-section__primary">
        {primary.map((f, i) => {
          const entry = f.id ? safeGet(f.id) : undefined;

          if (!entry) {
            return (
              <div
                key={i}
                className="d-flex flex-center familiar-section__list-item"
                onClick={() => openDialog(PrimaryOrAlternative.Primary, i)}
              >
                <Tooltip title="Add familiar">
                  <AddIcon
                    className="cursor-pointer familiar-section__add-familiar"
                    htmlColor="#646464"
                  />
                </Tooltip>
              </div>
            );
          }

          const url = safeUrl(entry.id);

          return (
            <div
              key={i}
              className="d-flex flex-center familiar-section__list-item"
              onClick={() => openDialog(PrimaryOrAlternative.Primary, i)}
            >
              <img
                className="familiar-section__list-item-image"
                src={url}
                alt={entry.name}
              />
              <span className="familiar-section__list-item-name">
                {entry.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ALTERNATIVE */}
      <div className="familiar-section__alternative">
        <div className="familiar-section__alternative__title">Alternative</div>

        {alt.map((f, i) => {
          const entry = safeGet(f.id);
          if (!entry) return null;

          const url = safeUrl(entry.id);

          return (
            <div
              key={i}
              className="d-flex flex-center familiar-section__list-item"
              onClick={() => openDialog(PrimaryOrAlternative.Alternative, i)}
            >
              <img
                className="familiar-section__list-item-image"
                src={url}
                alt={entry.name}
              />
              <span className="familiar-section__list-item-name">
                {entry.name}
              </span>
            </div>
          );
        })}

        {/* ADD NEW ALTERNATIVE */}
        <div
          className="d-flex flex-center familiar-section__list-item familiar-section__list-item--add"
          onClick={() =>
            openDialog(PrimaryOrAlternative.Alternative, alt.length)
          }
        >
          <Tooltip title="Add alternative familiar">
            <AddIcon
              className="cursor-pointer familiar-section__add-familiar"
              htmlColor="#646464"
            />
          </Tooltip>
        </div>
      </div>

      <EmojiSelectDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSelect={onSelect}
        slotType={"familiar"}
        slotKey=""
        slotIndex={selection.index}
        selectedIndices={[`${selection.index}`]}
        recentlySelected={[]}
      />
    </div>
  );
};
