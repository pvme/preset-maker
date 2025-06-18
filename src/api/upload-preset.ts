import axios from 'axios';
import { presetSchema } from '../schemas/preset';

interface UploadPresetResponse {
  id: string;
  imageUrl: string;
}

const {
  VITE_FIREBASE_EMULATOR_HOST,
  VITE_FIREBASE_PROJECT_ID,
  VITE_API_BASE_URL,
} = import.meta.env;

const useEmulator =
  import.meta.env.DEV &&
  !!VITE_FIREBASE_EMULATOR_HOST &&
  !!VITE_FIREBASE_PROJECT_ID;

const API_BASE = useEmulator
  ? `http://${VITE_FIREBASE_EMULATOR_HOST}/${VITE_FIREBASE_PROJECT_ID}/us-central1`
  : VITE_API_BASE_URL;

export async function uploadPreset(
  data: unknown,
  id?: string
): Promise<UploadPresetResponse> {
  const payload = typeof data === 'string' ? JSON.parse(data) : data;
  const preset = presetSchema.parse(payload); // ✅ use central schema

  const url = `${API_BASE}/uploadPreset${id ? `?id=${encodeURIComponent(id)}` : ''}`;

  const resp = await axios.post<UploadPresetResponse>(url, preset, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return resp.data;
}

export async function getPresetImageUrl(
  preset: unknown,
  id: string
): Promise<string> {
  const parsed = presetSchema.parse(preset);
  const url = `${API_BASE}/uploadPreset?id=${encodeURIComponent(id)}`;
  const resp = await axios.post<UploadPresetResponse>(url, parsed, {
    headers: { 'Content-Type': 'application/json' }
  });
  return resp.data.imageUrl;
}