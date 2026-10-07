import axiosClient from "./axiosClient";

export function toggleBookmark(problemId) {
  return axiosClient.post(`/bookmarks/${problemId}/toggle`);
}

export function getMyBookmarks() {
  return axiosClient.get("/bookmarks/me");
}