import axios, { InternalAxiosRequestConfig, AxiosRequestConfig } from "axios";

// Extend AxiosRequestConfig to include skipAuth
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    skipAuth?: boolean;
}

const api = axios.create({
    baseURL: "http://localhost:8080",
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

        const refreshToken =
            localStorage.getItem("refresh_token") ||
            sessionStorage.getItem("refresh_token");

        // ❌ If no refresh token → user is not logged in → do NOT refresh
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
                    { skipAuth: true }
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
