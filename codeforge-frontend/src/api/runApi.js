import axiosClient from "./axiosClient";

export function runCode(data) {
  return axiosClient.post("/run", data);
}