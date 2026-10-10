import axiosClient from "./axiosClient";

export const getAllBootcamps = () => axiosClient.get("/bootcamps");
export const getMyBootcamps = () => axiosClient.get("/bootcamps/me");
export const getBootcampById = (id) => axiosClient.get(`/bootcamps/${id}`);
export const enrollInBootcamp = (id) => axiosClient.post(`/bootcamps/${id}/enroll`);
export const leaveBootcamp = (id) => axiosClient.delete(`/bootcamps/${id}/enroll`);

export const createBootcamp = (data) => axiosClient.post("/bootcamps/admin", data);
export const updateBootcamp = (id, data) => axiosClient.put(`/bootcamps/admin/${id}`, data);
export const deleteBootcamp = (id) => axiosClient.delete(`/bootcamps/admin/${id}`);