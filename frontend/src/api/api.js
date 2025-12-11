import axios from "axios";

const BASE = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

export const uploadFile = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axios.post(`${BASE}/api/upload`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const clearData = () => {
  return axios.delete(`${BASE}/api/upload/clear`);
};

export const getConsumption = (from, to) => {
  return axios.get(`${BASE}/api/consumption`, { params: { from, to } });
};

export const getDateRange = () => {
  return axios.get(`${BASE}/api/consumption/date-range`);
};

export const getLocations = () => axios.get(`${BASE}/api/locations`);
