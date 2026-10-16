import axiosClient from "./axiosClient";

export const getMyCertificates = () => axiosClient.get("/certificates/me");
export const getCertificateEligibility = () => axiosClient.get("/certificates/eligibility");
export const claimCertificate = (data) => axiosClient.post("/certificates/claim", data);
export const getPublicCertificate = (code) =>
  axiosClient.get(`/public/certificates/${encodeURIComponent(code)}`);

export const getAdminCertificates = (q) =>
  axiosClient.get("/admin/certificates", { params: q ? { q } : {} });
export const revokeCertificate = (id, reason) =>
  axiosClient.post(`/admin/certificates/${id}/revoke`, { reason });
export const reinstateCertificate = (id) => axiosClient.post(`/admin/certificates/${id}/reinstate`);