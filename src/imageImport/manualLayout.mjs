export function createPresetManualLayout() {
  const blank = () => ({ step: 'inventory', inventory: { box: null, enabled: true, columns: 4, rows: 7, gap: 2 }, equipment: { box: null, enabled: true, columns: 3, rows: 4, gap: 2, kind: 'worn', overrides: {} } });
  const count = group => group === 'inventory' ? 28 : 12;
  function clamp(box, width, height) {
    const x = Math.max(0, Math.min(width - 1, Math.round(box.x))), y = Math.max(0, Math.min(height - 1, Math.round(box.y)));
    return { x, y, w: Math.max(1, Math.min(width - x, Math.round(box.w))), h: Math.max(1, Math.min(height - y, Math.round(box.h))) };
  }
  function regions(state) {
    const result = [];
    for (const group of ['inventory', 'equipment']) {
      const panel = state[group], box = panel.box;
      if (!panel.enabled || !box) continue;
      if (group === 'equipment' && panel.kind === 'worn') {
        if (box.w < 9 || box.h < 12) continue;
        const positions = [[54, 0], [14, 40], [54, 40], [0, 80], [54, 80], [108, 80], [54, 120], [0, 160], [54, 160], [108, 160], [94, 40], [94, 0]];
        positions.forEach(([x, y], index) => result.push({ group, index, x: box.x + x / 140 * box.w, y: box.y + y / 192 * box.h, w: 32 / 140 * box.w, h: 32 / 192 * box.h }));
      } else {
        const w = (box.w - (panel.columns - 1) * panel.gap) / panel.columns;
        const h = (box.h - (panel.rows - 1) * panel.gap) / panel.rows;
        if (w < 2 || h < 2 || panel.columns * panel.rows < count(group)) continue;
        for (let index = 0; index < count(group); index++) result.push({ group, index, x: box.x + index % panel.columns * (w + panel.gap), y: box.y + Math.floor(index / panel.columns) * (h + panel.gap), w, h });
      }
    }
    return result.map(region => ({ ...region, ...(region.group === 'equipment' ? state.equipment.overrides[region.index] : {}) }));
  }
  function ready(state) {
    const boxes = regions(state);
    return boxes.length > 0 && ['inventory', 'equipment'].every(group => !state[group].enabled || boxes.filter(box => box.group === group).length === count(group));
  }
  function grid(state, field, value) {
    if (!Number.isFinite(value)) return state;
    const group = state.step, panel = { ...state[group] };
    panel[field] = Math.max(field === 'gap' ? 0 : 1, Math.min(field === 'gap' ? 40 : count(group), Math.round(value)));
    if (field === 'columns') panel.rows = Math.ceil(count(group) / panel.columns);
    if (field === 'rows') panel.columns = Math.ceil(count(group) / panel.rows);
    if (group === 'equipment') panel.overrides = {};
    return { ...state, [group]: panel };
  }
  function place(state, box, width, height) {
    return { ...state, [state.step]: { ...state[state.step], enabled: true, box: clamp(box, width, height), ...(state.step === 'equipment' ? { overrides: {} } : {}) } };
  }
  function move(state, index, box, width, height) {
    return { ...state, equipment: { ...state.equipment, overrides: { ...state.equipment.overrides, [index]: clamp({ ...box, x: Math.min(box.x, width - box.w), y: Math.min(box.y, height - box.h) }, width, height) } } };
  }
  return { blank, regions, ready, grid, place, move, clamp };
}
