// src/api/upload-preset.ts

import axios from 'axios';
import { presetSchema } from '../schemas/preset';

interface UploadPresetResponse {
  id: string;
  imageUrl: string;
}

const {
  VITE_UPLOAD_PRESET_URL,
  VITE_DEV_SECRET,
  MODE
} = import.meta.env;

const isDev = MODE === 'development';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (isDev && VITE_DEV_SECRET) {
    headers['X-Dev-Secret'] = VITE_DEV_SECRET;
  }
  return headers;
}

export async function uploadPreset(
  data: unknown,
  id?: string
): Promise<UploadPresetResponse> {
  const payload = typeof data === 'string' ? JSON.parse(data) : data;
  const preset = presetSchema.parse(payload);

  const url = `${VITE_UPLOAD_PRESET_URL}${id ? `?id=${encodeURIComponent(id)}` : ''}`;
  const resp = await axios.post<UploadPresetResponse>(url, preset, { headers: getHeaders() });

  return resp.data;
}

export async function getPresetImageUrl(
  preset: unknown,
  id: string
): Promise<string> {
  const parsed = presetSchema.parse(preset);
  const url = `${VITE_UPLOAD_PRESET_URL}?id=${encodeURIComponent(id)}`;
  const resp = await axios.post<UploadPresetResponse>(url, parsed, { headers: getHeaders() });

  return resp.data.imageUrl;
}
