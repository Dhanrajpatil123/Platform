import axiosClient from "./axiosClient";

export function createContest(data) {
  return axiosClient.post("/contests/admin", data);
}

export function updateContest(id, data) {
  return axiosClient.put(`/contests/admin/${id}`, data);
}

export function deleteContest(id) {
  return axiosClient.delete(`/contests/admin/${id}`);
}

export function getContestReport(id) {
  return axiosClient.get(`/contests/admin/${id}/report`);
}