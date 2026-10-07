import axiosClient from "./axiosClient";

export function getPlans() {
  return axiosClient.get("/premium/plans");
}

export function getPremiumStatus() {
  return axiosClient.get("/premium/status");
}

export function checkoutPlan(plan) {
  return axiosClient.post("/premium/checkout", { plan });
}

export function cancelPremium() {
  return axiosClient.post("/premium/cancel");
}