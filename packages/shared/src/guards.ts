import type { FacilityCategory } from './types/infra';
import type { AirQualityGrade } from './types/environment';
import type { AdminRole } from './types/admin';
import type { TradeType, PricePeriod } from './types/price';
import { FACILITY_CATEGORIES, ADMIN_ROLES } from './constants';

/** 시설 카테고리 type guard */
export function isFacilityCategory(value: unknown): value is FacilityCategory {
  return (
    typeof value === 'string' &&
    (FACILITY_CATEGORIES as readonly string[]).includes(value)
  );
}

/** 대기질 등급 type guard */
export function isAirQualityGrade(value: unknown): value is AirQualityGrade {
  return (
    value === 'good' ||
    value === 'moderate' ||
    value === 'bad' ||
    value === 'veryBad'
  );
}

/** 운영자 역할 type guard */
export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && (ADMIN_ROLES as readonly string[]).includes(value);
}

/** 거래 유형 type guard */
export function isTradeType(value: unknown): value is TradeType {
  return value === 'sale' || value === 'rent';
}

/** 조회 기간 type guard */
export function isPricePeriod(value: unknown): value is PricePeriod {
  return value === '3m' || value === '6m' || value === '12m';
}

/** 한국 영토 좌표 범위 검증 (대략) */
export function isKoreanCoordinate(lat: number, lng: number): boolean {
  return lat >= 33.0 && lat <= 39.5 && lng >= 124.0 && lng <= 132.0;
}
