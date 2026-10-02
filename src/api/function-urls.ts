const {
  VITE_GET_PRESET_URL,
  VITE_UPLOAD_PRESET_URL,
} = import.meta.env;

export const FunctionURLs = {
  getPreset: VITE_GET_PRESET_URL,
  uploadPreset: VITE_UPLOAD_PRESET_URL,
};
