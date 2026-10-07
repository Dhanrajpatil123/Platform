import axiosClient from "./axiosClient";

export function getAllContests() {
  return axiosClient.get("/contests");
}

export function getContestById(id) {
  return axiosClient.get(`/contests/${id}`);
}

export function registerForContest(id) {
  return axiosClient.post(`/contests/${id}/register`);
}

export function startContestAttempt(id) {
  return axiosClient.post(`/contests/${id}/start`);
}

export function getContestAttempt(id) {
  return axiosClient.get(`/contests/${id}/attempt`);
}

export function endContestAttempt(id) {
  return axiosClient.post(`/contests/${id}/end`);
}

export function recordContestWarning(id) {
  return axiosClient.post(`/contests/${id}/warning`);
}

export function getContestLeaderboard(id) {
  return axiosClient.get(`/contests/${id}/leaderboard`);
}