import axiosClient from "./axiosClient";

export const getNotificationPreferences = () => axiosClient.get("/notifications/preferences");
export const updateNotificationPreferences = (emailEnabled) =>
  axiosClient.put("/notifications/preferences", { emailEnabled });
export const sendTestEmail = () => axiosClient.post("/notifications/test");