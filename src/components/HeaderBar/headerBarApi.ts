import axios from "axios";

const apiUrl = "https://us-central1-pvmebackend.cloudfunctions.net/uploadPreset";

export const UploadPreset = async (data: string) => {
  const response = await axios.post(apiUrl, data, {
    withCredentials: true,
  });
  return response.data;
};
