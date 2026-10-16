import axiosClient from "./axiosClient";

export const getAllTracks = () => axiosClient.get("/tracks");
export const getTrackById = (id) => axiosClient.get(`/tracks/${id}`);
export const enrollInTrack = (id) => axiosClient.post(`/tracks/${id}/enroll`);

export const createTrack = (data) => axiosClient.post("/tracks/admin", data);
export const updateTrack = (id, data) => axiosClient.put(`/tracks/admin/${id}`, data);
export const deleteTrack = (id) => axiosClient.delete(`/tracks/admin/${id}`);