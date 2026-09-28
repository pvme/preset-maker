const { normalizeLayout } = require("./layout");
function createRenderer({ createCanvas, loadImage, loadLocal, loadIconMap,
  resolveArray, resolveSlot, normalizePresetToV2, failOnImageError = false, fetchImageBytes, renderScale = 1 }) {
// -----------------------------------------------------
// Constants
// -----------------------------------------------------

const PRESET_WIDTH = 472;
const TITLE_HEIGHT = 34;

const FRAME_CORNER_SIZE = 4;
const FRAME_TOP_HEIGHT = 4;
const FRAME_SIDE_WIDTH = 4;

const EXTRAS_PADDING_X = 8;
const EXTRAS_PADDING_Y = 6;
const EXTRAS_GAP_X = 4;
const EXTRAS_GAP_Y = 8;

const LEFT_COL_WIDTH = 344;
const RIGHT_COL_WIDTH = 108;

const SECTION_TITLE_HEIGHT = 20;
const SECTION_TITLE_FONT = "700 14px Arial, sans-serif";

const CARD_GAP = 6;
const CARD_HEIGHT = 64;
const CARD_RADIUS = 8;
const CARD_ICON_SIZE = 30;
const CARD_NAME_FONT = "400 12px Arial, sans-serif";

const RELICS_TITLE = "Relics";
const FAMILIAR_TITLE = "Familiar";
const AMMO_TITLE = "Ammo / Spells";
const ASPECT_TITLE = "Aspect";

// Desktop coords from UI
const SLOT_METRICS = {
  inventory: {
    width: 38,
    height: 34,
    slotBoxWidth: 36,
    slotBoxHeight: 32,
  },
  equipment: {
    width: 32,
    height: 34,
    slotBoxWidth: 32,
    slotBoxHeight: 29,
  },
};

const inventoryCoords = Array.from({ length: 28 }, (_, index) => {
  const column = index % 7;
  const row = Math.floor(index / 7);
  return {
    x: 7 + column * 44,
    y: 7 + row * 36,
  };
});

const equipmentCoords = Array.from({ length: 12 }, (_, index) => {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: 334 + column * 49,
    y: 7 + row * 38,
  };
});

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function getSlotDisplayName(slot, iconMap) {
  if (!slot) return "";

  if (slot.name) return slot.name;
  if (slot.label) return slot.label;

  const id = slot.id?.trim().toLowerCase();
  if (id && iconMap?.byId?.[id]?.name) {
    return iconMap.byId[id].name;
  }

  return "";
}

function ellipsiseText(ctx, text, maxWidth) {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;

  let output = text;
  while (
    output.length > 0 &&
    ctx.measureText(`${output}...`).width > maxWidth
  ) {
    output = output.slice(0, -1);
  }

  return output ? `${output}...` : "";
}

function drawFrame(ctx, x, y, width, height, assets) {
  const { borderTop, borderSide, corner } = assets;

  ctx.drawImage(corner, x, y, FRAME_CORNER_SIZE, FRAME_CORNER_SIZE);

  ctx.save();
  ctx.translate(x + width, y);
  ctx.scale(-1, 1);
  ctx.drawImage(corner, 0, 0, FRAME_CORNER_SIZE, FRAME_CORNER_SIZE);
  ctx.restore();

  ctx.save();
  ctx.translate(x, y + height);
  ctx.scale(1, -1);
  ctx.drawImage(corner, 0, 0, FRAME_CORNER_SIZE, FRAME_CORNER_SIZE);
  ctx.restore();

  ctx.save();
  ctx.translate(x + width, y + height);
  ctx.scale(-1, -1);
  ctx.drawImage(corner, 0, 0, FRAME_CORNER_SIZE, FRAME_CORNER_SIZE);
  ctx.restore();

  for (let px = x + 4; px < x + width - 4; px += 3) {
    const w = Math.min(3, x + width - 4 - px);
    ctx.drawImage(borderTop, 0, 0, 3, 4, px, y, w, FRAME_TOP_HEIGHT);

    ctx.save();
    ctx.translate(0, y + height);
    ctx.scale(1, -1);
    ctx.drawImage(borderTop, 0, 0, 3, 4, px, 0, w, FRAME_TOP_HEIGHT);
    ctx.restore();
  }

  for (let py = y + 4; py < y + height - 4; py += 3) {
    const h = Math.min(3, y + height - 4 - py);
    ctx.drawImage(borderSide, 0, 0, 4, 3, x, py, FRAME_SIDE_WIDTH, h);

    ctx.save();
    ctx.translate(x + width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(borderSide, 0, 0, 4, 3, 0, py, FRAME_SIDE_WIDTH, h);
    ctx.restore();
  }
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCardBackground(ctx, x, y, width, height) {
  roundedRectPath(ctx, x, y, width, height, CARD_RADIUS);
  ctx.fillStyle = rgba(255, 255, 255, 0.015);
  ctx.fill();

  roundedRectPath(ctx, x + 0.5, y + 0.5, width - 1, height - 1, CARD_RADIUS);
  ctx.strokeStyle = rgba(255, 255, 255, 0.06);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawSectionTitle(ctx, title, x, y, width, align = "center") {
  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = SECTION_TITLE_FONT;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";

  const textX =
    align === "left" ? x : align === "right" ? x + width : x + width / 2;

  ctx.fillText(title, textX, y + 14);
  ctx.restore();
}

const imageCache = new Map();
async function loadResolvedImage(slot) {
  if (!slot?.image) return null;
  if (imageCache.has(slot.image)) return imageCache.get(slot.image);
  const loading = (async () => { try {
    let buffer;
    if (fetchImageBytes) buffer = await fetchImageBytes(slot.image);
    else {
      const res = await fetch(slot.image, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buffer = Buffer.from(await res.arrayBuffer());
    }
    return await loadImage(buffer);
  } catch (error) {
    imageCache.delete(slot.image);
    if (failOnImageError) throw error;
    console.warn(`Unable to load icon ${slot.id}: ${error.message}`);
    return null;
  } })();
  if (imageCache.size >= 512) imageCache.clear();
  imageCache.set(slot.image, loading);
  return loading;
}

async function drawExtraCard(ctx, slot, x, y, width, height, iconMap) {
  drawCardBackground(ctx, x, y, width, height);

  const img = await loadResolvedImage(slot);
  const name = getSlotDisplayName(slot, iconMap);

  const iconX = x + (width - CARD_ICON_SIZE) / 2;
  const iconY = y + 8;

  if (img) {
    const scale = Math.min(
      CARD_ICON_SIZE / img.width,
      CARD_ICON_SIZE / img.height,
    );
    const w = img.width * scale;
    const h = img.height * scale;
    const dx = iconX + (CARD_ICON_SIZE - w) / 2;
    const dy = iconY + (CARD_ICON_SIZE - h) / 2;
    ctx.drawImage(img, dx, dy, w, h);
  }

  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = CARD_NAME_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const text = ellipsiseText(ctx, name, width - 12);
  ctx.fillText(text, x + width / 2, y + height - 10);
  ctx.restore();
}

function getVisibleItems(items, maxItems) {
  return Array.from({ length: maxItems }, (_, i) => items[i] ?? { id: "" })
    .filter((item) => item && item.id);
}

async function drawExtrasSection(ctx, config) {
  const {
    x,
    y,
    width,
    title,
    items,
    maxItems,
    columns,
    iconMap,
    titleAlign = "center",
  } = config;

  const visibleItems = getVisibleItems(items, maxItems);

  drawSectionTitle(ctx, title, x, y, width, titleAlign);

  if (visibleItems.length === 0) {
    return {
      height: SECTION_TITLE_HEIGHT,
    };
  }

  const itemsY = y + SECTION_TITLE_HEIGHT;
  const rows = Math.ceil(visibleItems.length / columns);
  const cardWidth = Math.floor((width - CARD_GAP * (columns - 1)) / columns);

  for (let i = 0; i < visibleItems.length; i += 1) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const cardX = x + col * (cardWidth + CARD_GAP);
    const cardY = itemsY + row * (CARD_HEIGHT + CARD_GAP);

    await drawExtraCard(
      ctx,
      visibleItems[i],
      cardX,
      cardY,
      cardWidth,
      CARD_HEIGHT,
      iconMap,
    );
  }

  return {
    height:
      SECTION_TITLE_HEIGHT +
      rows * CARD_HEIGHT +
      Math.max(0, rows - 1) * CARD_GAP,
  };
}

function drawTiledBackground(ctx, image, x, y, width, height) {
  for (let py = y; py < y + height; py += image.height) {
    for (let px = x; px < x + width; px += image.width) {
      const drawW = Math.min(image.width, x + width - px);
      const drawH = Math.min(image.height, y + height - py);
      ctx.drawImage(image, 0, 0, drawW, drawH, px, py, drawW, drawH);
    }
  }
}

async function drawSlotAtCoord(ctx, slot, coord, metric, options = {}) {
  if (!slot?.image) return;

  const img = await loadResolvedImage(slot);
  if (!img) return;

  const boxW = metric.slotBoxWidth;
  const boxH = metric.slotBoxHeight;
  const x = coord.x + (metric.width - boxW) / 2;
  const y = coord.y + (metric.height - boxH) / 2;

  if (options.slotBackground) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, boxW, boxH);
    ctx.clip();
    ctx.globalAlpha = 1;
    ctx.drawImage(options.slotBackground, x, y, boxW, boxH);
    ctx.restore();
  }

  const scale = Math.min(boxW / img.width, boxH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const dx = x + (boxW - w) / 2;
  const dy = y + (boxH - h) / 2;

  ctx.drawImage(img, dx, dy, w, h);
}

// -----------------------------------------------------
// Main render
// -----------------------------------------------------

async function renderPresetImage(rawPreset, layout) {
  const portrait = normalizeLayout(layout) === "4x7";
  const preset = await normalizePresetToV2(structuredClone(rawPreset));
  const invCoords = portrait ? Array.from({ length: 28 }, (_, i) => ({
    x: 12 + (i % 4) * 45, y: 12 + Math.floor(i / 4) * 39,
  })) : inventoryCoords;
  const eqCoords = portrait ? [
    [1, 0], [0.25, 1], [1, 1], [0, 2], [1, 2], [2, 2],
    [1, 3], [0, 4], [1, 4], [2, 4], [1.75, 1], [1.75, 0],
  ].map(([col, row]) => ({ x: 202 + 14 + col * 59, y: 46 + row * 44 })) : equipmentCoords;
  const panelWidth = portrait ? 381 : PRESET_WIDTH;
  const leftWidth = portrait ? 273 : LEFT_COL_WIDTH;
  const rightWidth = portrait ? 88 : RIGHT_COL_WIDTH;

  const iconMap = await loadIconMap();

  preset.inventorySlots = resolveArray(preset.inventorySlots, iconMap);
  preset.equipmentSlots = resolveArray(preset.equipmentSlots, iconMap);
  preset.relics = resolveArray(preset.relics, iconMap);
  preset.ammoSpells = resolveArray(
    preset.ammoSpells ?? preset.AmmoSpells ?? [],
    iconMap,
  );
  preset.familiar = resolveSlot(preset.familiar, iconMap);
  preset.aspect = resolveSlot(preset.aspect, iconMap);

  await Promise.all([
    ...preset.inventorySlots, ...preset.equipmentSlots, ...preset.relics,
    ...preset.ammoSpells, preset.familiar, preset.aspect,
  ].map(loadResolvedImage));

  const [presetMapDesktop, extrasBackground, borderTop, borderSide, corner] =
    await Promise.all([
      loadLocal("presetmap_desktop.png"),
      loadLocal("bg.png"),
      loadLocal("border-top.png"),
      loadLocal("border-side.png"),
      loadLocal("corner.png"),
    ]);

  const frameAssets = { borderTop, borderSide, corner };

  const topPanelHeight = portrait ? 296 : presetMapDesktop.height;
  const contentX = EXTRAS_PADDING_X;

  const relicsHeight = SECTION_TITLE_HEIGHT + CARD_HEIGHT;
  const familiarHeight = SECTION_TITLE_HEIGHT + CARD_HEIGHT;
  const ammoHeight = SECTION_TITLE_HEIGHT + CARD_HEIGHT;
  const aspectHeight = SECTION_TITLE_HEIGHT + CARD_HEIGHT;

  const topRowHeight = Math.max(relicsHeight, familiarHeight);
  const bottomRowHeight = Math.max(ammoHeight, aspectHeight);

  const extrasPanelHeight =
    EXTRAS_PADDING_Y +
    topRowHeight +
    EXTRAS_GAP_Y +
    bottomRowHeight +
    EXTRAS_PADDING_Y;

  const canvasWidth = panelWidth;
  const canvasHeight = TITLE_HEIGHT + topPanelHeight + extrasPanelHeight;

  const canvas = createCanvas(canvasWidth * renderScale, canvasHeight * renderScale);
  const ctx = canvas.getContext("2d");
  ctx.scale(renderScale, renderScale);
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "#17120f";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = "700 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    ellipsiseText(ctx, preset.presetName || "Unnamed preset", canvasWidth - 16),
    canvasWidth / 2,
    TITLE_HEIGHT / 2,
  );
  ctx.restore();

  const topX = 0;
  const topY = TITLE_HEIGHT;

  if (portrait) {
    drawTiledBackground(ctx, extrasBackground, 0, topY, panelWidth, topPanelHeight);
    // Match the frontend's body-shaped equipment arrangement and sprite crops.
    ctx.save();
    ctx.translate(202, topY);
    ctx.strokeStyle = "#454134";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(89, 63); ctx.lineTo(89, 239);
    ctx.moveTo(30, 151); ctx.lineTo(148, 151);
    ctx.moveTo(30, 151); ctx.lineTo(30, 239);
    ctx.moveTo(148, 151); ctx.lineTo(148, 239);
    ctx.stroke(); ctx.restore();
    for (const [coords, slots, metric, equipment] of [
      [invCoords, preset.inventorySlots, SLOT_METRICS.inventory, false],
      [eqCoords, preset.equipmentSlots, SLOT_METRICS.equipment, true],
    ]) {
      coords.forEach((coord, i) => {
        const source = equipment && !slots[i]?.id ? equipmentCoords[i] : { x: 7, y: 7 };
        ctx.drawImage(presetMapDesktop, source.x, source.y, metric.width, metric.height,
          coord.x, topY + coord.y, metric.width, metric.height);
      });
    }
    drawFrame(ctx, 0, topY, 197, topPanelHeight, frameAssets);
    drawFrame(ctx, 202, topY, 179, topPanelHeight, frameAssets);
  } else {
    ctx.drawImage(presetMapDesktop, topX, topY);
    drawFrame(ctx, topX, topY, panelWidth, topPanelHeight, frameAssets);
  }

  for (
    let i = 0;
    i < Math.min(preset.inventorySlots.length, invCoords.length);
    i += 1
  ) {
    await drawSlotAtCoord(
      ctx,
      preset.inventorySlots[i],
      { x: topX + invCoords[i].x, y: topY + invCoords[i].y },
      SLOT_METRICS.inventory,
    );
  }

  for (
    let i = 0;
    i < Math.min(preset.equipmentSlots.length, eqCoords.length);
    i += 1
  ) {
    await drawSlotAtCoord(
      ctx,
      preset.equipmentSlots[i],
      { x: topX + eqCoords[i].x, y: topY + eqCoords[i].y },
      SLOT_METRICS.equipment,
      { slotBackground: extrasBackground },
    );
  }

  const extrasX = 0;
  const extrasY = topY + topPanelHeight;

  drawTiledBackground(
    ctx,
    extrasBackground,
    extrasX,
    extrasY,
    panelWidth,
    extrasPanelHeight,
  );
  drawFrame(
    ctx,
    extrasX,
    extrasY,
    panelWidth,
    extrasPanelHeight,
    frameAssets,
  );

  const sectionsTopY = extrasY + EXTRAS_PADDING_Y;
  const sectionsBottomY = sectionsTopY + topRowHeight + EXTRAS_GAP_Y;

  await drawExtrasSection(ctx, {
    x: contentX,
    y: sectionsTopY,
    width: leftWidth,
    title: RELICS_TITLE,
    items: preset.relics.slice(0, 3),
    maxItems: 3,
    columns: 3,
    iconMap,
    titleAlign: "left",
  });

  await drawExtrasSection(ctx, {
    x: contentX + leftWidth + EXTRAS_GAP_X,
    y: sectionsTopY,
    width: rightWidth,
    title: FAMILIAR_TITLE,
    items: [preset.familiar],
    maxItems: 1,
    columns: 1,
    iconMap,
  });

  await drawExtrasSection(ctx, {
    x: contentX,
    y: sectionsBottomY,
    width: leftWidth,
    title: AMMO_TITLE,
    items: (preset.ammoSpells ?? []).slice(0, 3),
    maxItems: 3,
    columns: 3,
    iconMap,
    titleAlign: "left",
  });

  await drawExtrasSection(ctx, {
    x: contentX + leftWidth + EXTRAS_GAP_X,
    y: sectionsBottomY,
    width: rightWidth,
    title: ASPECT_TITLE,
    items: [preset.aspect],
    maxItems: 1,
    columns: 1,
    iconMap,
  });

  const buffer = canvas.toBuffer("image/png");

  return buffer;
}

return { renderPresetImage };
}
module.exports = { createRenderer };
