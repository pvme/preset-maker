import axios from "axios";

const apiUrl = "https://us-central1-pvmebackend.cloudfunctions.net/uploadPreset";

export const UploadPreset = async (data: string) => {
  data = (typeof(data) === "object" ? data : JSON.parse(data));
  const response = await axios.post(apiUrl, data, {
    withCredentials: false,
  });
  return response.data;
};
