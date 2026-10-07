import axiosClient from "./axiosClient";

export function getProfileStats() {
  return axiosClient.get("/profile/stats");
}

export function getMyProfile() {
  return axiosClient.get("/profile/me");
}

export function updateMyProfile(data) {
  return axiosClient.put("/profile/me", data);
}