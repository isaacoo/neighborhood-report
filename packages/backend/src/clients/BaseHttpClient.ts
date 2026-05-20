import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { HTTP_CLIENT_POLICY } from '@neighborhood-report/shared';

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
  apiName: string;
  responseType?: 'json' | 'text';
}

export class HttpClientError extends Error {
  constructor(
    public apiName: string,
    public httpStatus: number | null,
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

/**
 * 모든 외부 공공 API client의 공통 베이스.
 * 재시도 / 타임아웃 / 응답시간 측정 / 표준 에러 처리.
 */
export abstract class BaseHttpClient {
  protected abstract baseUrl: string;

  async get<T>(path: string, options: RequestOptions): Promise<T> {
    const retries = options.retries ?? HTTP_CLIENT_POLICY.retries;
    const timeout = options.timeout ?? HTTP_CLIENT_POLICY.timeoutMs;
    const url = `${this.baseUrl}${path}`;

    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const start = Date.now();
      try {
        const config: AxiosRequestConfig = {
          params: options.params,
          timeout,
          responseType: options.responseType === 'text' ? 'text' : 'json',
          validateStatus: (s) => s >= 200 && s < 300,
        };
        const res = await axios.get<T>(url, config);
        const elapsed = Date.now() - start;
        // ApiStatusRecorder integration이 도입되면 여기서 record('success', elapsed)
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[${options.apiName}] OK ${res.status} ${elapsed}ms`);
        }
        return res.data;
      } catch (err) {
        lastError = err;
        const elapsed = Date.now() - start;
        const status = (err as AxiosError).response?.status ?? null;
        const isLast = attempt === retries;
        if (process.env.NODE_ENV !== 'test') {
          console.warn(
            `[${options.apiName}] FAIL attempt=${attempt + 1}/${retries + 1} status=${status} ${elapsed}ms`,
          );
        }
        if (!isLast) {
          const backoff = HTTP_CLIENT_POLICY.backoffMs[Math.min(attempt, HTTP_CLIENT_POLICY.backoffMs.length - 1)];
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }
    const status = (lastError as AxiosError | undefined)?.response?.status ?? null;
    const message = (lastError as Error | undefined)?.message ?? 'Unknown error';
    throw new HttpClientError(options.apiName, status, message, lastError);
  }
}
