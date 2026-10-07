import axiosClient from "./axiosClient";

export function createCourse(data) {
  return axiosClient.post("/courses/admin", data);
}

export function updateCourse(id, data) {
  return axiosClient.put(`/courses/admin/${id}`, data);
}

export function deleteCourse(id) {
  return axiosClient.delete(`/courses/admin/${id}`);
}