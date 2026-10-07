import axiosClient from "./axiosClient";

export function getTestCases(problemId) {
  return axiosClient.get(`/problems/admin/${problemId}/testcases`);
}

export function addTestCase(problemId, data) {
  return axiosClient.post(`/problems/admin/${problemId}/testcases`, data);
}

export function deleteTestCase(problemId, testCaseId) {
  return axiosClient.delete(`/problems/admin/${problemId}/testcases/${testCaseId}`);
}