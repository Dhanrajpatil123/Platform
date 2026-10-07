import axiosClient from "./axiosClient";

export function getGlobalLeaderboard() {
  return axiosClient.get("/leaderboard");
}

export function getCourseLeaderboard(courseId) {
  return axiosClient.get(`/leaderboard/course/${courseId}`);
}