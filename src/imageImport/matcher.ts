import { createPresetImageMatcher } from "./iconMatcher.mjs";
export const FINGERPRINT_SIZE = 24;
export const KEEP_CURRENT = "__keep__";
export type Layout = "auto" | "game" | "inventory" | "equipment";
export type Group = "inventory" | "equipment";
export interface Box { x: number; y: number; w: number; h: number }
export interface Region extends Box { group: Group; index: number }
export interface Pixels { data: Uint8ClampedArray; width: number; height: number }
export interface Fingerprint { vector: Uint8Array; empty: boolean; count: number }
export interface Template { id: string; variant: number; slot?: number; family?: string; vector: Uint8Array }
export interface Candidate { id: string; score: number; family?: string; empty?: boolean }
export interface Selection { group: Group; index: number; selected: string }

const matcher = createPresetImageMatcher();
export const fingerprint = matcher.fingerprint;
export const queries = matcher.queries;
export const rank = matcher.rank;
export const suggest = matcher.suggest;

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
  } else if (layout === "equipment") {
    equipmentPositions.forEach(([x, y], i) => add("equipment", i, x - 208, y - 41, 32, 32, 140, 192));
  }
  return result;
}
