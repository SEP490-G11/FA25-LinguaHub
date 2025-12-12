import axios, { InternalAxiosRequestConfig, AxiosRequestConfig } from "axios";

// Custom config type with skipAuth option
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    skipAuth?: boolean;
}

/**
 * Get API URL with clear priority logic
 * Priority:
 * 1. If VITE_API_URL is set => always use it (allows override for any environment)
 * 2. If in DEV mode => use localhost backend
 * 3. Otherwise (production build) => use production backend
 */
const getApiUrl = (): string => {
    const envApi = import.meta.env.VITE_API_URL?.trim();
    
    // If user explicitly sets API via environment variable => use it
    if (envApi) {
        console.log('[API] Using VITE_API_URL:', envApi);
        return envApi;
    }
    
    // If running locally in dev mode => use local backend
    if (import.meta.env.DEV) {
        console.log('[API] DEV mode detected, using localhost backend');
        return 'http://localhost:8086';
    }
    
    // Otherwise (production build) => use production backend
    console.log('[API] Production mode, using cloud backend');
    return 'https://centralized.henrytech.cloud';
};

const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

/* ----------------------------- REQUEST TOKEN ----------------------------- */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
        if (config.skipAuth) return config;
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

/* ------------------------ REFRESH TOKEN QUEUE --------------------------- */
let isRefreshing = false;

let failedQueue: {
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((p) => {
        if (error) p.reject(error);
        else p.resolve(token!);
    });
    failedQueue = [];
};

/* ----------------------------- RESPONSE LOGIC ---------------------------- */
api.interceptors.response.use(
    (res) => res,

    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // ---- Stop if this request does not require auth ----
        if (originalRequest?.skipAuth) {
            return Promise.reject(error);
        }

        // ---- Prevent retry for auth endpoints to avoid infinite loops ----
        const url = originalRequest?.url || '';
        if (url.includes('/auth/verify') || url.includes('/auth/refresh') || url.includes('/auth/login')) {
            return Promise.reject(error);
        }

        const refreshToken =
            localStorage.getItem("refresh_token") ||
            sessionStorage.getItem("refresh_token");

        //  If no refresh token → user is not logged in → do NOT refresh
        if ((status === 401 || status === 403) && !refreshToken) {
            return Promise.reject(error);
        }

        if ((status === 401 || status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        },
                        reject,
                    });
                });
            }

            isRefreshing = true;

            try {
                const res = await api.post(
                    "/auth/refresh",
                    { refreshToken },
                    { skipAuth: true } as CustomAxiosRequestConfig
                );

                const newAccess = res.data?.result?.accessToken;
                const newRefresh = res.data?.result?.refreshToken;

                if (localStorage.getItem("refresh_token")) {
                    localStorage.setItem("access_token", newAccess);
                    localStorage.setItem("refresh_token", newRefresh);
                } else {
                    sessionStorage.setItem("access_token", newAccess);
                    sessionStorage.setItem("refresh_token", newRefresh);
                }

                processQueue(null, newAccess);

                originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);

                // Clear token silently - do NOT redirect
                localStorage.clear();
                sessionStorage.clear();

                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
