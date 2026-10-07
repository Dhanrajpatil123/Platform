import axiosClient from "./axiosClient";

export function getActiveAnnouncement() {
  return axiosClient.get("/announcements/active");
}

export function getCurrentAnnouncementAdmin() {
  return axiosClient.get("/admin/announcements");
}

export function updateAnnouncementAdmin(data) {
  return axiosClient.put("/admin/announcements", data);
}