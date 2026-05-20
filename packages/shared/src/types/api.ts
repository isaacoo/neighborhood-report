/** API 상태 */
export type ApiStatus = 'normal' | 'delayed' | 'failed' | 'quota_exceeded';

/** API 상태 정보 */
export interface ApiStatusInfo {
  name: string;
  status: ApiStatus;
  lastResponseTime: number | null;
  lastError: string | null;
  lastErrorAt: string | null;
  lastSuccessAt: string | null;
}

/** 외부 API 호출 1회 기록 (ApiStatusRecorder 입력) */
export interface ApiCallRecord {
  apiName: string;
  status: ApiStatus | 'success';
  responseTimeMs: number | null;
  errorMessage: string | null;
  httpStatus: number | null;
  recordedAt: string;
}

/** API 응답 시간 통계 */
export interface ApiPercentileStats {
  p50: number;
  p95: number;
  p99: number;
  windowMinutes: number;
}

/** 공통 API 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    dataTimestamp?: string;
    isStaleCache?: boolean;
  };
}

/** 페이지네이션 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  countPerPage: number;
}

/** 표준 에러 코드 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'EXTERNAL_API_ERROR'
  | 'INTERNAL_ERROR';
