import React, { useCallback } from 'react';
import { DragPreviewImage, useDrag, useDrop } from 'react-dnd';

import { equipmentCoords, equipmentCoordsMobile, inventoryCoords, inventoryCoordsMobile } from '../../data/coordinates';
import { type Coord } from '../../schemas/coord';
import { type Item as ItemData } from '../../schemas/item-data';
import { isMobile } from '../../utility/window-utils';

import { useEmojiMap } from '../../hooks/useEmojiMap'

import './SlotSection.css';

interface SlotProps {
  slots: ItemData[]
  handleClickOpen: (event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => void
  handleDragAndDrop?: (dragIndex: number, dropIndex: number) => void
  handleShiftClick?: (event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => void
}

interface SlotSectionProps extends SlotProps {
  coords: Coord[]
  className: string
  rootClassName: string
}

interface SingleSlotProps extends SlotProps {
  index: number
  coord: Coord
  className: string
}

const SingleSlot = ({ index, coord, className, slots, handleClickOpen, handleShiftClick, handleDragAndDrop }: SingleSlotProps): JSX.Element | null => {
  const slot = slots[index];
  if (!slot) {
    console.error(`SingleSlot: undefined slot at index ${index}`);
    return null;
  }

  const { getEmojiUrl } = useEmojiMap();
  const emojiUrl = slot.image || getEmojiUrl(slot.name);
 
  const getClassName = (slot: ItemData): string => {
    const selectedClass = slot.selected ? `${className}-icon-container--selected` : '';
    return `${className}-icon-container ${selectedClass}`;
  };

  const slotHasImage = Boolean(emojiUrl);
  const slotIsSelected = slot.selected ?? false;

  const onSlotSelect = useCallback((event: React.MouseEvent<HTMLAreaElement>, index: number) => {
    if (event.shiftKey && handleShiftClick) {
      handleShiftClick(event, index, className);
    } else {
      handleClickOpen(event, index, className);
    }
  }, [handleShiftClick, handleClickOpen, className]);

  const [{ opacity }, dragRef, dragPreview] = useDrag(
    () => ({
      type: 'INVENTORY_SLOT',
      item: { slot, index },
      collect: (monitor) => ({
        slot,
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    [slots]
  );

  const [, dropRef] = useDrop(() => ({
    accept: 'INVENTORY_SLOT',
    drop: (item: { index: number }) => {
      if (handleDragAndDrop) handleDragAndDrop(item.index, index);
    }
  }), [slots]);

  return (
    <>
      {emojiUrl && <DragPreviewImage connect={dragPreview} src={emojiUrl} />}
      <div ref={dropRef}>
        <div key={index + new Date().getTime()} style={{ position: 'relative' }} ref={dragRef}>
          <area
            title={slot.name}
            key={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            style={{ cursor: 'pointer', opacity, userSelect: 'auto' }}
            shape="rect"
            coords={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            onClick={(event: React.MouseEvent<HTMLAreaElement>) => { onSlotSelect(event, index); }}
          />
          {(slotHasImage || slotIsSelected) && (
            <div
              className={getClassName(slot)}
              style={{ top: coord.y1, left: coord.x1, userSelect: 'auto' }}
            >
              {slotHasImage && (
                <img
                  key={index}
                  className={`${className}-icon`}
                  style={{ userSelect: 'auto' }}
                  src={emojiUrl}
                  alt={slot.name}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const SlotSection = ({ slots, handleClickOpen, handleShiftClick, handleDragAndDrop, coords, className, rootClassName }: SlotSectionProps): JSX.Element => {
  return (
    <div className={rootClassName}>
      {Array.isArray(slots) && Array.isArray(coords) && coords.map((coord: Coord, index: number) => {
        const slot = slots[index];
        if (!slot) {
          console.warn(`Skipping index ${index} — no slot defined`, { index, coord });
          return null;
        }

        return (
          <SingleSlot
            key={index}
            slots={slots}
            coord={coord}
            index={index}
            className={className}
            handleClickOpen={handleClickOpen}
            handleShiftClick={handleShiftClick}
            handleDragAndDrop={handleDragAndDrop}
          />
        );
      })}
    </div>
  );
};

export const Inventory = (props: SlotProps): JSX.Element => {
  const coordsToUse = isMobile() ? inventoryCoordsMobile : inventoryCoords;
  const className = isMobile() ? 'inventory inventory--mobile' : 'inventory';

  return (
    <SlotSection {...props} coords={coordsToUse} className="inventory" rootClassName={className} />
  );
};

export const Equipment = (props: SlotProps): JSX.Element => {
  const coordsToUse = isMobile() ? equipmentCoordsMobile : equipmentCoords;
  const className = isMobile() ? 'equipment equipment--mobile' : 'equipment';
  return <SlotSection {...props} coords={coordsToUse} className="equipment" rootClassName={className} />;
};
