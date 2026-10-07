import axiosClient from "./axiosClient";

export function getDashboardStats() {
  return axiosClient.get("/dashboard/stats");
}