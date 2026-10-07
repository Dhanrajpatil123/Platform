import axiosClient from "./axiosClient";

export function searchPlatform(query) {
  return axiosClient.get(`/search?q=${encodeURIComponent(query)}`);
}