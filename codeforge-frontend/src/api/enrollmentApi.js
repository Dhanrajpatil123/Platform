import axiosClient from "./axiosClient";

export function enrollInCourse(courseId) {
  return axiosClient.post(`/enrollments/${courseId}`);
}

export function getMyEnrollments() {
  return axiosClient.get("/enrollments/me");
}

export function checkEnrollment(courseId) {
  return axiosClient.get(`/enrollments/me/course/${courseId}`);
}