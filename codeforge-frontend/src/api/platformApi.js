import axiosClient from "./axiosClient";

export function getPlatformStats() {
  return axiosClient.get("/public/stats");
}