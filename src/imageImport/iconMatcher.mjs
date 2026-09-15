export function createPresetImageMatcher() {
  const size = 24;
  const weights = Float32Array.from({ length: size * size }, (_, p) => 1 + 2 * (1 - Math.abs((p % size) / (size - 1) * 2 - 1)) * (1 - Math.abs(Math.floor(p / size) / (size - 1) * 2 - 1)));
  function fingerprint(pixels, strict = false, hideQuantity = false) {
    const { data, width, height } = pixels;
    let left = width, right = -1, top = height, bottom = -1, count = 0;
    const active = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4, max = Math.max(data[p], data[p + 1], data[p + 2]), min = Math.min(data[p], data[p + 1], data[p + 2]);
      const foreground = strict ? max > 75 || (max > 45 && max - min > 30) : (max > 55 || (max > 32 && max - min > 24)) && !(data[p] > data[p + 2] && data[p] >= data[p + 1] && data[p + 1] >= data[p + 2] && max - min < 25 && max < 85);
      if (data[p + 3] >= 40 && foreground && (!hideQuantity || y >= height * .3)) {
        active[y * width + x] = 1; count++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    const vector = new Uint8Array(size * size * 3);
    if (count < 4) return { vector, empty: true, count };
    const values = new Float32Array(vector.length);
    const w = right - left + 1, h = bottom - top + 1, scale = Math.max(w, h) / (size - 2);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const q = (y * size + x) * 3;
      for (const oy of [-.33, 0, .33]) for (const ox of [-.33, 0, .33]) {
        const sx = left + (x + ox - (size - 1) / 2) * scale + (w - 1) / 2;
        const sy = top + (y + oy - (size - 1) / 2) * scale + (h - 1) / 2;
        const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
        for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
          const xx = ix + dx, yy = iy + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height || !active[yy * width + xx]) continue;
          const p = (yy * width + xx) * 4, weight = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) / 9;
          for (let c = 0; c < 3; c++) values[q + c] += data[p + c] * weight;
        }
      }
    }
    for (let p = 0; p < vector.length; p++) vector[p] = Math.round(values[p]);
    return { vector, empty: false, count };
  }
  function queries(pixels) {
    const result = [fingerprint(pixels), fingerprint(pixels, true)];
    let yellow = 0, left = pixels.width;
    for (let y = 0; y < pixels.height * .28; y++) for (let x = 0; x < pixels.width; x++) {
      const p = (y * pixels.width + x) * 4, d = pixels.data;
      if (d[p] > 170 && d[p + 1] > 160 && d[p + 2] < 90) { yellow++; left = Math.min(left, x); }
    }
    if (yellow >= 3 && left < pixels.width * .2) result.push(fingerprint(pixels, false, true), fingerprint(pixels, true, true));
    return result;
  }
  function rank(query, entries, limit = 5) {
    if (query.empty) return [{ id: '', score: 0, empty: true }];
    const best = [];
    for (const entry of entries) {
      let loss = 0, energy = 0;
      for (let p = 0; p < query.vector.length; p += 3) {
        const a = query.vector, b = entry.vector;
        const qa = a[p] + a[p + 1] + a[p + 2], qb = b[p] + b[p + 1] + b[p + 2];
        if (!qa && !qb) continue;
        const weight = weights[p / 3];
        energy += weight * Math.max(qa, qb) / 765;
        loss += weight * (Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2])) / 765;
      }
      const score = energy ? loss / energy : 1;
      const existing = best.findIndex(candidate => candidate.id === entry.id);
      if (existing >= 0) { if (best[existing].score <= score) continue; best.splice(existing, 1); }
      if (best.length < limit || score < best[best.length - 1].score) {
        best.push({ id: entry.id, family: entry.family, score }); best.sort((a, b) => a.score - b.score); if (best.length > limit) best.pop();
      }
    }
    return best;
  }
  const equipmentPositions = [[262, 41], [222, 81], [262, 81], [208, 121], [262, 121], [316, 121], [262, 161], [208, 201], [262, 201], [316, 201], [302, 81], [302, 41]];
  function regions(layout, box) {
    const regions = [];
    const add = (group, index, x, y, w, h, baseW, baseH) => regions.push({ group, index, x: box.x + x / baseW * box.w, y: box.y + y / baseH * box.h, w: w / baseW * box.w, h: h / baseH * box.h });
    if (layout === 'game') {
      for (let i = 0; i < 28; i++) add('inventory', i, 20 + i % 4 * 40, 7 + Math.floor(i / 4) * 36, 36, 32, 358, 304);
      equipmentPositions.forEach(([x,y], i) => add('equipment', i, x, y, 32, 32, 358, 304));
    } else if (layout === 'inventory') {
      for (let i = 0; i < 28; i++) add('inventory', i, i % 4, Math.floor(i / 4), 1, 1, 4, 7);
    } else if (layout === 'equipment') {
      equipmentPositions.forEach(([x,y], i) => add('equipment', i, x - 208, y - 41, 32, 32, 140, 192));
    }
    return regions;
  }
  function apply(current, matches) {
    const next = structuredClone(current);
    for (const match of matches) {
      if (!['inventory', 'equipment'].includes(match.group) || !Number.isInteger(match.index) || match.index < 0 || match.index >= next[match.group].length || typeof match.selected !== 'string') continue;
      if (match.selected !== '__keep__') next[match.group][match.index] = match.selected;
    }
    return next;
  }
  function suggest(queries, entries, limit = 6) {
    if (queries.length && queries.every(query => query.empty)) return { candidates: [{ id: '', score: 0, empty: true }], selected: '', confident: true };
    const modes = new Map(), leaders = new Map();
    queries.forEach((query, variant) => {
      if (query.empty) return;
      const ranked = rank(query, entries.filter(e => e.variant === variant), Math.max(limit, 24));
      const first = ranked[0], second = first && ranked.find(candidate => (candidate.family || candidate.id) !== (first.family || first.id));
      if (first) leaders.set(variant, { key: first.family || first.id, score: first.score, gap: second ? second.score - first.score : 1 });
      for (const candidate of ranked) {
        const key = candidate.id + ':' + Math.floor(variant / 2);
        if (!modes.has(key)) modes.set(key, { ...candidate, mode: Math.floor(variant / 2), scores: [1, 1] });
        modes.get(key).scores[variant % 2] = candidate.score;
      }
    });
    const candidates = [...modes.values()].map(candidate => {
      const mode = candidate.mode * 2, key = candidate.family || candidate.id;
      const a = leaders.get(mode), b = leaders.get(mode + 1);
      const consistent = a?.key === key && b?.key === key;
      const agreement = consistent &&
        ((a.score < .075 && a.gap > .12) || (b.score < .075 && b.gap > .12));
      const distinct = (a?.key === key && a.score < .25 && a.gap > .2) ||
        (b?.key === key && b.score < .25 && b.gap > .2);
      return { ...candidate, agreement, consistent, distinct, score: candidate.scores[0] * .75 + candidate.scores[1] * .25 };
    });
    const unique = new Map();
    for (const candidate of candidates) { const key = candidate.family || candidate.id; if (!unique.has(key) || unique.get(key).score > candidate.score) unique.set(key, candidate); }
    const best = [...unique.values()].sort((a, b) => a.score - b.score).slice(0, limit);
    const strong = best[0] && (best[0].agreement || (best[0].score < .4 &&
      (best[0].score < .3 || best[0].consistent || best[0].distinct) && (!best[1] || best[1].score - best[0].score >
        (best[0].score >= .3 ? .12 : Math.max(.012, Math.min(.035, best[0].score * .12))))));
    return { candidates: best.map(({ id, score, family, empty }) => ({ id, score, ...(family ? { family } : {}), ...(empty ? { empty } : {}) })),
      selected: strong && !best[0].empty ? best[0].id : '__keep__', confident: !!strong && !best[0].empty };
  }
  return { size, fingerprint, queries, rank, regions, suggest, apply };
}
