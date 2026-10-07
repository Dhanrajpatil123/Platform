// import axiosClient from "./axiosClient";

// export function createProblem(data) {
//   return axiosClient.post("/problems/admin", data);
// }

// export function updateProblem(id, data) {
//   return axiosClient.put(`/problems/admin/${id}`, data);
// }

// export function deleteProblem(id) {
//   return axiosClient.delete(`/problems/admin/${id}`);
// }

// export function bulkImportProblems(file) {
//   const formData = new FormData();
//   formData.append("file", file);
//   return axiosClient.post("/problems/admin/bulk-import", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// }

import axiosClient from "./axiosClient";

export function createProblem(data) {
  return axiosClient.post("/problems/admin", data);
}

export function updateProblem(id, data) {
  return axiosClient.put(`/problems/admin/${id}`, data);
}

export function deleteProblem(id) {
  return axiosClient.delete(`/problems/admin/${id}`);
}

export function bulkImportProblems(file) {
  const formData = new FormData();
  formData.append("file", file);
  // No manual Content-Type header — letting axios/the browser set it
  // automatically is required for the multipart boundary to be included.
  return axiosClient.post("/problems/admin/bulk-import", formData);
}