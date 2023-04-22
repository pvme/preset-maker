import React from 'react';
import { equipmentCoords, equipmentCoordsMobile, inventoryCoords, inventoryCoordsMobile } from '../../data/coordinates';
import { type Coord } from '../../types/coord';
import { type ItemData } from '../../types/item-data';

import './SlotSection.css';

interface SlotProps {
  slots: ItemData[]
  handleClickOpen: (event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => void
  handleShiftClick?: (event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => void
}

interface SlotSectionProps extends SlotProps {
  coords: Coord[]
  className: string
}

const SlotSection = ({ slots, handleClickOpen, handleShiftClick, coords, className }: SlotSectionProps): JSX.Element => {
  const getClassName = (slot: ItemData): string => {
    const selectedClass = (slot.selected ?? false) ? `${className}-icon-container--selected` : '';
    return `${className}-icon-container ${selectedClass}`;
  };

  const slotHasImage = (slot: ItemData): boolean => {
    return slot?.image?.length > 0;
  };

  const slotIsSelected = (slot: ItemData): boolean => {
    return slot?.selected ?? false;
  };

  return (
    <div>
      {coords.map((coord: Coord, index: number) => (
        <div key={index + new Date().getTime()} style={{ position: 'relative' }}>
          <area
            key={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            style={{ cursor: 'pointer' }}
            shape="rect"
            coords={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            onClick={(event: React.MouseEvent<HTMLAreaElement>) => {
              if (event.shiftKey && (handleShiftClick != null)) {
                handleShiftClick(event, index, className);
                return;
              }

              handleClickOpen(event, index, className);
            }}
          />
          {slotHasImage(slots[index]) || slotIsSelected(slots[index])
            ? (
            <div
              className={getClassName(slots[index])}
              style={{
                top: coord.y1,
                left: coord.x1
              }}
            >
              {((slots[index]?.image).length > 0)
                ? <img key={index} className={`${className}-icon`} src={slots[index].image} alt={slots[index].name} />
                : null
              }
            </div>
              )
            : null}
        </div>
      ))}
    </div>
  );
};

export const Inventory = (props: SlotProps): JSX.Element => {
  // TODO Create listener, use hook, etc.
  const coordsToUse = window.innerWidth > 800
    ? inventoryCoords
    : inventoryCoordsMobile;
  return <SlotSection {...props} coords={coordsToUse} className="inventory" />;
};

export const Equipment = (props: SlotProps): JSX.Element => {
  const coordsToUse = window.innerWidth > 800
    ? equipmentCoords
    : equipmentCoordsMobile;
  return <SlotSection {...props} coords={coordsToUse} className="equipment" />;
};
