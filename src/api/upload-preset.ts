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
  id?: string,
): Promise<UploadPresetResponse> {
  const payload = structuredClone(data);

  payload.equipmentSlots = (payload.equipmentSlots ?? []).slice(0, 12);
  payload.inventorySlots = (payload.inventorySlots ?? []).slice(0, 28);

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

export async function getPresetImageUrl(
  preset: SavedPreset,
  id: string,
): Promise<string> {
  const payload = structuredClone(preset);

  payload.equipmentSlots = (payload.equipmentSlots ?? []).slice(0, 12);
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
