import axiosClient from "./axiosClient";

export function getAllUsersAdmin() {
  return axiosClient.get("/admin/users");
}

export function getUserDetailAdmin(id) {
  return axiosClient.get(`/admin/users/${id}`);
}

export function grantPremiumAdmin(id, days) {
  return axiosClient.post(`/admin/users/${id}/premium/grant`, { days });
}

export function revokePremiumAdmin(id) {
  return axiosClient.post(`/admin/users/${id}/premium/revoke`);
}

export function updateUserYearAdmin(id, year) {
  return axiosClient.put(`/admin/users/${id}/year`, { year });
}