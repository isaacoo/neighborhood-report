/** 캐시 엔트리 */
export interface CacheEntry {
  id: string;
  apiName: string;
  requestParams: Record<string, string>;
  rawResponse: unknown;
  processedData: unknown;
  cachedAt: string;
  expiresAt: string;
  regionCode: string;
}

/** 캐시 TTL 설정 (밀리초) */
export const CACHE_TTL = {
  realEstate: 24 * 60 * 60 * 1000,
  facility: 7 * 24 * 60 * 60 * 1000,
  airQuality: 60 * 60 * 1000,
  weather: 60 * 60 * 1000,
  regionCode: 30 * 24 * 60 * 60 * 1000,
} as const;

/** 캐시 상태 */
export interface CacheStatus {
  apiName: string;
  regionCode: string;
  cachedAt: string;
  expiresAt: string;
  isExpired: boolean;
}
