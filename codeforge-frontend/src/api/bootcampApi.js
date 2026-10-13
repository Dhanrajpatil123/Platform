import axiosClient from "./axiosClient";

export const getAllBootcamps = () => axiosClient.get("/bootcamps");
export const getMyBootcamps = () => axiosClient.get("/bootcamps/me");
export const getBootcampById = (id) => axiosClient.get(`/bootcamps/${id}`);
// export const enrollInBootcamp = (id) => axiosClient.post(`/bootcamps/${id}/enroll`);
export const leaveBootcamp = (id) => axiosClient.delete(`/bootcamps/${id}/enroll`);

export const createBootcamp = (data) => axiosClient.post("/bootcamps/admin", data);
export const updateBootcamp = (id, data) => axiosClient.put(`/bootcamps/admin/${id}`, data);
export const deleteBootcamp = (id) => axiosClient.delete(`/bootcamps/admin/${id}`);

export const enrollInBootcamp = (id, body) =>
  axiosClient.post(`/bootcamps/${id}/enroll`, body ?? null);

export const getBootcampSessions = (bootcampId) => axiosClient.get(`/bootcamps/${bootcampId}/sessions`);

export const createBootcampSession = (bootcampId, data) =>
  axiosClient.post(`/bootcamps/admin/${bootcampId}/sessions`, data);
export const updateBootcampSession = (sessionId, data) =>
  axiosClient.put(`/bootcamps/admin/sessions/${sessionId}`, data);
export const deleteBootcampSession = (sessionId) =>
  axiosClient.delete(`/bootcamps/admin/sessions/${sessionId}`);

export const getSessionAttendance = (sessionId) =>
  axiosClient.get(`/bootcamps/admin/sessions/${sessionId}/attendance`);
export const saveSessionAttendance = (sessionId, presentUserIds) =>
  axiosClient.put(`/bootcamps/admin/sessions/${sessionId}/attendance`, { presentUserIds });