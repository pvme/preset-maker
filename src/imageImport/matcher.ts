export const FINGERPRINT_SIZE = 16;
export const KEEP_CURRENT = "__keep__";
export type Layout = "game" | "inventory" | "equipment";
export type Group = "inventory" | "equipment";
export interface Box { x: number; y: number; w: number; h: number }
export interface Region extends Box { group: Group; index: number }
export interface Pixels { data: Uint8ClampedArray; width: number; height: number }
export interface Fingerprint { vector: Uint8Array; empty: boolean; count: number }
export interface Template { id: string; variant: number; slot?: number; vector: Uint8Array }
export interface Candidate { id: string; score: number; empty?: boolean }
export interface Selection { group: Group; index: number; selected: string }

export function fingerprint({ data, width, height }: Pixels, strict = false): Fingerprint {
  let left = width, right = -1, top = height, bottom = -1, count = 0;
  const active = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const max = Math.max(data[p], data[p + 1], data[p + 2]);
      const min = Math.min(data[p], data[p + 1], data[p + 2]);
      const foreground = strict
        ? max > 75 || (max > 45 && max - min > 30)
        : (max > 55 || (max > 32 && max - min > 24)) &&
          !(data[p] > data[p + 2] && data[p] >= data[p + 1] &&
            data[p + 1] >= data[p + 2] && max - min < 25 && max < 85);
      if (data[p + 3] >= 40 && foreground) {
        active[y * width + x] = 1;
        count++;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  const vector = new Uint8Array(FINGERPRINT_SIZE ** 2 * 3);
  if (count < 4) return { vector, empty: true, count };
  const w = right - left + 1, h = bottom - top + 1;
  const scale = Math.max(w, h) / (FINGERPRINT_SIZE - 2);
  for (let y = 0; y < FINGERPRINT_SIZE; y++) {
    for (let x = 0; x < FINGERPRINT_SIZE; x++) {
      const sx = Math.round(left + (x - (FINGERPRINT_SIZE - 1) / 2) * scale + (w - 1) / 2);
      const sy = Math.round(top + (y - (FINGERPRINT_SIZE - 1) / 2) * scale + (h - 1) / 2);
      if (sx < 0 || sx >= width || sy < 0 || sy >= height || !active[sy * width + sx]) continue;
      const p = (sy * width + sx) * 4, q = (y * FINGERPRINT_SIZE + x) * 3;
      vector.set(data.subarray(p, p + 3), q);
    }
  }
  return { vector, empty: false, count };
}

export function rank(query: Fingerprint, entries: Template[], limit = 6): Candidate[] {
  if (query.empty) return [{ id: "", score: 0, empty: true }];
  const best: Candidate[] = [];
  for (const entry of entries) {
    let loss = 0, energy = 0;
    for (let p = 0; p < query.vector.length; p += 3) {
      const a = query.vector, b = entry.vector;
      const qa = a[p] + a[p + 1] + a[p + 2], qb = b[p] + b[p + 1] + b[p + 2];
      if (!qa && !qb) continue;
      energy += Math.max(qa, qb) / 765;
      loss += (Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2])) / 765;
    }
    const score = energy ? loss / energy : 1;
    const existing = best.findIndex(candidate => candidate.id === entry.id);
    if (existing >= 0) {
      if (best[existing].score <= score) continue;
      best.splice(existing, 1);
    }
    if (best.length < limit || score < best[best.length - 1].score) {
      best.push({ id: entry.id, score });
      best.sort((a, b) => a.score - b.score);
      if (best.length > limit) best.pop();
    }
  }
  return best;
}

export function suggest(queries: Fingerprint[], entries: Template[], limit = 6) {
  const candidates = queries.flatMap((query, variant) =>
    rank(query, entries.filter(e => e.variant === variant), limit));
  const unique = new Map<string, Candidate>();
  for (const candidate of candidates) {
    if (!unique.has(candidate.id) || unique.get(candidate.id)!.score > candidate.score) {
      unique.set(candidate.id, candidate);
    }
  }
  const best = [...unique.values()].sort((a, b) => a.score - b.score).slice(0, limit);
  const strong = best[0] && best[0].score < .45 &&
    (!best[1] || best[1].score - best[0].score > .035);
  const confident = !!strong && !best[0].empty;
  return { candidates: best, selected: confident ? best[0].id : KEEP_CURRENT, confident };
}

const equipmentPositions = [[262, 41], [222, 81], [262, 81], [208, 121], [262, 121], [316, 121],
  [262, 161], [208, 201], [262, 201], [316, 201], [302, 81], [302, 41]];

export function regions(layout: Layout, box: Box): Region[] {
  const result: Region[] = [];
  const add = (group: Group, index: number, x: number, y: number, w: number, h: number, baseW: number, baseH: number) => {
    result.push({ group, index, x: box.x + x / baseW * box.w, y: box.y + y / baseH * box.h,
      w: w / baseW * box.w, h: h / baseH * box.h });
  };
  if (layout === "game") {
    for (let i = 0; i < 28; i++) add("inventory", i, 20 + i % 4 * 40, 7 + Math.floor(i / 4) * 36, 36, 32, 358, 304);
    equipmentPositions.forEach(([x, y], i) => add("equipment", i, x, y, 32, 32, 358, 304));
  } else if (layout === "inventory") {
    for (let i = 0; i < 28; i++) add("inventory", i, i % 4, Math.floor(i / 4), 1, 1, 4, 7);
  } else {
    equipmentPositions.forEach(([x, y], i) => add("equipment", i, x - 208, y - 41, 32, 32, 140, 192));
  }
  return result;
}
