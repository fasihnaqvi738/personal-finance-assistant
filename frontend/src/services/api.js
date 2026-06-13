import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default api;
