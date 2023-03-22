import axios from "axios";

const apiUrl =
  "https://us-central1-pvmebackend.cloudfunctions.net/getPreset?id=";

export const GetPreset = async (id: string) => {
  const response = await axios.get(`${apiUrl}${id}`);
  return response.data;
};
