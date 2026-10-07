import axiosClient from "./axiosClient";

export function signup(data) {
  return axiosClient.post("/auth/signup", data);
}

export function login(data) {
  return axiosClient.post("/auth/login", data);
}

export function forgotPassword(data) {
  return axiosClient.post("/auth/forgot-password", data);
}

export function resetPassword(data) {
  return axiosClient.post("/auth/reset-password", data);
}