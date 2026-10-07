import axiosClient from "./axiosClient";

export function createSubmission(data) {
  return axiosClient.post("/submissions", data);
}

export function getMySubmissions() {
  return axiosClient.get("/submissions/me");
}

export function getMySubmissionsForProblem(problemId) {
  return axiosClient.get(`/submissions/me/problem/${problemId}`);
}

export function getSolvedProblemIds() {
  return axiosClient.get("/submissions/me/solved");
}