// src/api/upload-preset.ts

import axios from "axios";
import { getAuth } from "../utility/firebase-init";
import { getDevHeaders } from "./get-headers";
import { FunctionURLs } from "./function-urls";

import { type SavedPreset } from "../schemas/saved-preset-data";

interface UploadPresetResponse {
  id: string;
  imageUrl: string;
}

export async function uploadPreset(
  data: SavedPreset,
  id?: string
): Promise<UploadPresetResponse> {
  // Defensive clone to avoid mutating caller state
  const payload = structuredClone(data);

  // Safety: normalise slot lengths
  payload.equipmentSlots = (payload.equipmentSlots ?? []).slice(0, 14);
  payload.inventorySlots = (payload.inventorySlots ?? []).slice(0, 28);

  // Safety: legacy field must never be persisted
  delete payload.presetImage;

  const url = `${FunctionURLs.uploadPreset}${id ? `?id=${encodeURIComponent(id)}` : ""}`;

  const idToken = await getAuth().currentUser?.getIdToken();

  const response = await axios.post<UploadPresetResponse>(url, payload, {
    headers: {
      "Content-Type": "application/json",
      ...getDevHeaders(),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });

  return response.data;
}

/**
 * Trigger image regeneration without changing preset identity.
 * Preset payload is cleaned but otherwise identical to uploadPreset.
 */
export async function getPresetImageUrl(
  preset: SavedPreset,
  id: string
): Promise<string> {
  const payload = structuredClone(preset);

  payload.equipmentSlots = (payload.equipmentSlots ?? []).slice(0, 14);
  payload.inventorySlots = (payload.inventorySlots ?? []).slice(0, 28);
  delete payload.presetImage;

  const url = `${FunctionURLs.uploadPreset}?id=${encodeURIComponent(id)}`;

  const idToken = await getAuth().currentUser?.getIdToken();

  const response = await axios.post<UploadPresetResponse>(url, payload, {
    headers: {
      "Content-Type": "application/json",
      ...getDevHeaders(),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });

  return response.data.imageUrl;
}
