import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './api-error';
import type { HttpRequestConfig, IHttpClient } from './http-client.interface';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://fakedomain:1111/api'
).replace(/\/$/, '');

export const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_URL ?? new URL(API_BASE_URL).origin).replace(
  /\/$/,
  '',
);

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

type AuthErrorPayload = {
  code?: string;
  message?: string | string[];
};

const ACCOUNT_INACTIVE_EVENT = 'courthub:account-inactive';

function isInactiveError(error: unknown): boolean {
  if (error instanceof ApiError) return error.code === 'AUTH_ACCOUNT_INACTIVE';
  if (!axios.isAxiosError(error)) return false;

  const payload = error.response?.data as AuthErrorPayload | undefined;
  return payload?.code === 'AUTH_ACCOUNT_INACTIVE';
}

export class AxiosHttpClient implements IHttpClient {
  private readonly client: AxiosInstance;
  private isRefreshing = false;
  private hasHandledInactiveAccount = false;
  private refreshQueue: Array<{
    resolve: () => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(baseURL = API_BASE_URL) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (baseURL.includes('.ngrok')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    this.client = axios.create({
      baseURL,
      withCredentials: true,
      headers,
      timeout: 15000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => {
        const url = response.config.url ?? '';
        if (
          url.includes('/auth/login') ||
          url.includes('/auth/register') ||
          url.includes('/auth/refresh') ||
          url.includes('/auth/me')
        ) {
          this.hasHandledInactiveAccount = false;
        }
        return response;
      },
      async (error: AxiosError<{ message?: string | string[]; code?: string }>) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined;
        const requestUrl = originalRequest?.url ?? '';
        const shouldSkipRefresh =
          requestUrl.includes('/auth/login') ||
          requestUrl.includes('/auth/register') ||
          requestUrl.includes('/auth/refresh') ||
          requestUrl.includes('/auth/me');

        if (isInactiveError(error)) {
          this.handleInactiveAccount();
          return Promise.reject(this.formatError(error));
        }

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !shouldSkipRefresh
        ) {
          if (this.isRefreshing) {
            return new Promise<void>((resolve, reject) => {
              this.refreshQueue.push({ resolve, reject });
            })
              .then(() => this.client(originalRequest))
              .catch((err) => Promise.reject(this.formatError(err)));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.client.post('/auth/refresh');
            this.processQueue(null);
            return await this.client(originalRequest);
          } catch (refreshError) {
            if (isInactiveError(refreshError)) {
              this.handleInactiveAccount();
            }
            this.processQueue(refreshError);
            return Promise.reject(this.formatError(refreshError as AxiosError));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.formatError(error));
      },
    );
  }

  private handleInactiveAccount(): void {
    if (this.hasHandledInactiveAccount) return;
    this.hasHandledInactiveAccount = true;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(ACCOUNT_INACTIVE_EVENT));
    }

    void this.client.post('/auth/logout').catch(() => undefined);
  }

  private processQueue(error: unknown): void {
    this.refreshQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.refreshQueue = [];
  }

  private formatError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const data = error.response.data as
          { message?: string | string[]; code?: string } | undefined;
        const message =
          data && typeof data === 'object' && 'message' in data
            ? Array.isArray(data.message)
              ? data.message.join(', ')
              : data.message
            : error.message || 'Request failed';
        const code = data && typeof data === 'object' ? data.code : undefined;

        return new ApiError(message || 'Request failed', error.response.status, code, data);
      }

      if (error.request) {
        return new ApiError('No response received from server', 0, 'NETWORK_ERROR');
      }

      return new ApiError(error.message || 'Request failed', 0, 'CLIENT_ERROR');
    }

    if (error instanceof Error) {
      return new ApiError(error.message, 0, 'CLIENT_ERROR');
    }

    return new ApiError('Unknown error', 0, 'CLIENT_ERROR');
  }

  async get<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const httpClient: IHttpClient = new AxiosHttpClient();
