import axiosClient from "./axiosClient";

export function getAllProblems() {
  return axiosClient.get("/problems");
}

export function getProblemById(id) {
  return axiosClient.get(`/problems/${id}`);
}

export function getDailyChallenge() {
  return axiosClient.get("/problems/daily/today");
}

export function getProblemNeighbors(id, courseId) {
  return axiosClient.get(`/problems/${id}/neighbors`, {
    params: courseId ? { course: courseId } : {},
  });
}