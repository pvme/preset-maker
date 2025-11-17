const {
  MODE,
  VITE_FIREBASE_EMULATOR_HOST,
  VITE_FIREBASE_PROJECT_ID,
  VITE_GET_PRESET_URL,
  VITE_UPLOAD_PRESET_URL,
  VITE_PRESET_EMBED_URL,
  VITE_RENDER_PRESET_IMAGE_URL,
  VITE_ON_PRESET_WRITE_URL
} = import.meta.env;

const isDev = MODE === 'development';

const localPrefix = `http://${VITE_FIREBASE_EMULATOR_HOST}/${VITE_FIREBASE_PROJECT_ID}/us-central1`;

export const FunctionURLs = {
  getPreset:           isDev ? `${localPrefix}/getPreset`           : VITE_GET_PRESET_URL,
  uploadPreset:        isDev ? `${localPrefix}/uploadPreset`        : VITE_UPLOAD_PRESET_URL,
  presetEmbed:         isDev ? `${localPrefix}/presetEmbed`         : VITE_PRESET_EMBED_URL,
  renderPresetImage:   isDev ? `${localPrefix}/renderPresetImage`   : VITE_RENDER_PRESET_IMAGE_URL,
  onPresetWrite:       isDev ? `${localPrefix}/onPresetWrite`       : VITE_ON_PRESET_WRITE_URL,
};
