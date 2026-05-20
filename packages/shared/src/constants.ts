import type { FacilityCategory } from './types/infra';
import type { AirQualityGrade } from './types/environment';
import type { AdminRole } from './types/admin';

/** 시설 카테고리 목록 (순서 보존) */
export const FACILITY_CATEGORIES: readonly FacilityCategory[] = [
  'hospital',
  'pharmacy',
  'school',
  'park',
  'public',
  'transit',
] as const;

/** 면적대 분류 임계값 (전용면적 ㎡ 기준) */
export const AREA_RANGES = [
  { id: 'small', label: '~59㎡', min: 0, max: 59 },
  { id: 'medium', label: '59~84㎡', min: 59, max: 84 },
  { id: 'large', label: '84~135㎡', min: 84, max: 135 },
  { id: 'xlarge', label: '135㎡~', min: 135, max: Infinity },
] as const;

/** 통합대기환경지수(KHAI) 등급 임계값 */
export const AIR_QUALITY_GRADE_THRESHOLDS: ReadonlyArray<{ max: number; grade: AirQualityGrade }> = [
  { max: 50, grade: 'good' },
  { max: 100, grade: 'moderate' },
  { max: 250, grade: 'bad' },
  { max: Infinity, grade: 'veryBad' },
];

/** 점수 카테고리 (Score_Engine) */
export const SCORE_CATEGORIES = [
  'housing',
  'infrastructure',
  'transit',
  'environment',
  'safety',
  'reliability',
] as const;

export type ScoreCategory = typeof SCORE_CATEGORIES[number];

/** 후보지 등록 최대 개수 */
export const MAX_CANDIDATES = 5;

/** 별칭 최대 길이 */
export const MAX_ALIAS_LENGTH = 30;

/** 검색어 최대 길이 */
export const MAX_SEARCH_QUERY_LENGTH = 100;

/** 신뢰도 낮음 판정 거래 건수 임계값 */
export const LOW_RELIABILITY_TRADE_COUNT = 5;

/** JWT 만료 시간 (초) */
export const JWT_EXPIRES_SECONDS = 60 * 60; // 1시간

/** 비밀번호 정책 */
export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
} as const;

/** 로그인 잠금 정책 */
export const LOGIN_LOCK_POLICY = {
  maxFailedAttempts: 5,
  lockDurationMinutes: 15,
} as const;

/** 외부 API 호출 정책 */
export const HTTP_CLIENT_POLICY = {
  timeoutMs: 5000,
  retries: 3,
  backoffMs: [100, 500, 2000] as const,
} as const;

/** Rate limit 정책 (분당 요청 수) */
export const RATE_LIMIT_PER_MINUTE = {
  search: 60,
  report: 10,
  admin: 100,
} as const;

/** 운영자 역할 목록 */
export const ADMIN_ROLES: readonly AdminRole[] = ['superadmin', 'admin'] as const;

/** 외부 API 식별자 (api status / 캐시 키 prefix용) */
export const API_NAMES = {
  regionCode: 'mois.region-code',
  molitTrade: 'molit.apt-trade',
  molitRent: 'molit.apt-rent',
  airKorea: 'environ.airkorea',
  kmaForecast: 'kma.short-forecast',
  hiraHospital: 'hira.hospital',
} as const;

export type ApiName = typeof API_NAMES[keyof typeof API_NAMES];
