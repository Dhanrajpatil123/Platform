// import axios from "axios";

// const axiosClient = axios.create({
//   baseURL: "http://localhost:8080/api",
// });

// // Attach the JWT token to every outgoing request, if one exists
// axiosClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default axiosClient;

import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api",
});

// Attach the JWT token to every outgoing request, if one exists
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Cache-bust every GET request with a unique timestamp param. Without
  // this, the browser's own HTTP cache can silently keep serving an old
  // response for a list endpoint (e.g. GET /api/problems) even after the
  // underlying data changes — exactly what caused Previous/Next to use a
  // stale, incomplete problem list after a bulk import added new problems.
  // This guarantees freshness regardless of what cache headers the server
  // sends or how the browser chooses to interpret them.
  if (config.method === "get") {
    config.params = { ...config.params, _: Date.now() };
  }

  return config;
});

export default axiosClient;