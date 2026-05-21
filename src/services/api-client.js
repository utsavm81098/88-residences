import axios from "axios";
import { ENV_CONFIG } from "@/utils/env-config";
import {
  ERROR_MESSAGES,
  LOCAL_STORAGE_KEY,
  METHODS,
} from "@/utils/app-constants";
import { getLocalStorage } from "@/utils/local-storage";

const BASE_URL = ENV_CONFIG.API_BASE_URL;
const DEFAULT_PREFIX = "/wp-json";

const axiosInstance = axios.create({
  baseURL: BASE_URL + DEFAULT_PREFIX,
  withCredentials: false,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getLocalStorage(LOCAL_STORAGE_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network / CORS / timeout / offline
    if (!error.response) {
      return Promise.reject({
        status: null,
        message: ERROR_MESSAGES.network,
      });
    }

    const { status, data } = error.response;

    const message =
      data?.message || (ERROR_MESSAGES[status] ?? ERROR_MESSAGES.common);

    const customError = {
      status,
      message,
      data,
    };

    if (status === 401) {
      localStorage.clear();
      // emit auth:logout event (UI decides redirect)
    }

    return Promise.reject(customError);
  },
);

/**
 * Generic API client for all HTTP requests.
 */
const client = async (config) => {
  const { method = METHODS.GET, url, data, params, headers, signal } = config;

  const response = await axiosInstance({
    method,
    url,
    data,
    params,
    headers,
    signal,
  });

  return response.data;
};

export default client;
