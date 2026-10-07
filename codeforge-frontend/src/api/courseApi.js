import axiosClient from "./axiosClient";

export function getAllCourses() {
  return axiosClient.get("/courses");
}

export function getCourseById(id) {
  return axiosClient.get(`/courses/${id}`);
}