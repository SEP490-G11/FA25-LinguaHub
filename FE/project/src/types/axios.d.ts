import "axios";

declare module "axios" {
    export interface AxiosRequestConfig {
        skipAuth?: boolean;
    }
}
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    skipAuth?: boolean;
}
