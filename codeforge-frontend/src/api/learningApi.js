import axiosClient from "./axiosClient";

export const getMyLearning = () => axiosClient.get("/learning/me");