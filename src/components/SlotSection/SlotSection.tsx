import React, { useCallback } from 'react';
import { DragPreviewImage, useDrag, useDrop } from 'react-dnd';

import { equipmentCoords, equipmentCoordsMobile, inventoryCoords, inventoryCoordsMobile } from '../../data/coordinates';
import { type Coord } from '../../types/coord';
import { type ItemData } from '../../types/item-data';
import { isMobile } from '../../utility/window-utils';

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

const SingleSlot = ({ index, coord, className, slots, handleClickOpen, handleShiftClick, handleDragAndDrop }: SingleSlotProps): JSX.Element => {
  const slot = slots[index];

  const getClassName = (slot: ItemData): string => {
    const selectedClass = (slot.selected ?? false) ? `${className}-icon-container--selected` : '';
    return `${className}-icon-container ${selectedClass}`;
  };

  const getSlotHoverText = (slot: ItemData): string => {
    const itemName = slot.name;
    const breakdownNotes = slot.breakdownNotes;

    let hoverText = `Name: ${itemName}`;
    if (breakdownNotes !== undefined && breakdownNotes.length !== 0) {
      hoverText += `\nNotes: ${breakdownNotes}`;
    }

    return hoverText;
  };

  const slotHasImage = (slot?: ItemData): boolean => {
    return (slot?.image?.length ?? 0) > 0;
  };

  const slotIsSelected = (slot?: ItemData): boolean => {
    return slot?.selected ?? false;
  };

  const onSlotSelect = useCallback((event: React.MouseEvent<HTMLAreaElement>, index: number) => {
    if (event.shiftKey && (handleShiftClick != null)) {
      handleShiftClick(event, index, className);
      return;
    }

    handleClickOpen(event, index, className);
  }, [handleShiftClick, handleClickOpen, className]);

  const [{ opacity }, dragRef, dragPreview] = useDrag(
    () => ({
      type: 'INVENTORY_SLOT',
      item: { slot: slots[index], index },
      collect: (monitor) => {
        return {
          slot,
          opacity: monitor.isDragging() ? 0.5 : 1
        };
      }
    }),
    [slots]
  );

  const [, dropRef] = useDrop(() => ({
    accept: 'INVENTORY_SLOT',
    drop: (item: { index: number }) => {
      const startIndex = item.index;
      if (handleDragAndDrop !== undefined) {
        handleDragAndDrop(startIndex, index);
      }
    }
  }), [slots]);

  return (
    <>
      <DragPreviewImage connect={dragPreview} src={slot.image} />
      <div ref={dropRef}>
        <div key={index + new Date().getTime()} style={{ position: 'relative' }} ref={dragRef}>
          <area
            title={getSlotHoverText(slots[index])}
            key={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            style={{ cursor: 'pointer', opacity, userSelect: 'auto' }}
            shape="rect"
            coords={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            onClick={(event: React.MouseEvent<HTMLAreaElement>) => { onSlotSelect(event, index); }}
          />
          {slotHasImage(slots[index]) || slotIsSelected(slots[index])
            ? (
            <>
              <div
                className={getClassName(slots[index])}
                style={{
                  top: coord.y1,
                  left: coord.x1,
                  userSelect: 'auto'
                }}
              >
                {(slotHasImage(slots[index]))
                  ? <>
                    <img
                      key={index}
                      className={`${className}-icon`}
                      style={{
                        userSelect: 'auto'
                      }}
                      src={slots[index].image}
                      alt={slots[index].name}
                    />
                  </>
                  : null
                }
              </div>
            </>
              )
            : null}
      </div>
    </div>
    </>
  );
};

const SlotSection = ({ slots, handleClickOpen, handleShiftClick, handleDragAndDrop, coords, className, rootClassName }: SlotSectionProps): JSX.Element => {
  return (
    <div className={rootClassName}>
      {coords.map((coord: Coord, index: number) => (
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
      ))}
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
