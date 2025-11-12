import axios from 'axios';
import { presetSchema } from '../schemas/preset';
import { FunctionURLs } from './function-urls';
import { getDevHeaders } from './get-headers';

interface UploadPresetResponse {
  id: string;
  imageUrl: string;
}

export async function uploadPreset(
  data: unknown,
  id?: string
): Promise<UploadPresetResponse> {
  const payload = typeof data === 'string' ? JSON.parse(data) : data;

  payload.equipmentSlots = (payload.equipmentSlots || []).slice(0, 13);
  payload.inventorySlots = (payload.inventorySlots || []).slice(0, 28);

  const preset = presetSchema.parse(payload);

  const url = `${FunctionURLs.uploadPreset}${id ? `?id=${encodeURIComponent(id)}` : ''}`;
  const resp = await axios.post<UploadPresetResponse>(url, preset, {
    headers: {
      'Content-Type': 'application/json',
      ...getDevHeaders(),
    },
  });

  return resp.data;
}

export async function getPresetImageUrl(
  preset: unknown,
  id: string
): Promise<string> {
  const parsed = presetSchema.parse(preset);
  const url = `${FunctionURLs.uploadPreset}?id=${encodeURIComponent(id)}`;
  const resp = await axios.post<UploadPresetResponse>(url, parsed, {
    headers: {
      'Content-Type': 'application/json',
      ...getDevHeaders(),
    },
  });

  return resp.data.imageUrl;
}
