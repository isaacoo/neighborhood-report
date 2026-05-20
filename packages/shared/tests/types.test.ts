import { describe, it, expect } from 'vitest';
import {
  isFacilityCategory,
  isAirQualityGrade,
  isAdminRole,
  isTradeType,
  isPricePeriod,
  isKoreanCoordinate,
  FACILITY_CATEGORIES,
  AREA_RANGES,
  AIR_QUALITY_GRADE_THRESHOLDS,
  SCORE_CATEGORIES,
  MAX_CANDIDATES,
  MAX_ALIAS_LENGTH,
  MAX_SEARCH_QUERY_LENGTH,
  LOW_RELIABILITY_TRADE_COUNT,
  JWT_EXPIRES_SECONDS,
  PASSWORD_POLICY,
  LOGIN_LOCK_POLICY,
  HTTP_CLIENT_POLICY,
  RATE_LIMIT_PER_MINUTE,
  ADMIN_ROLES,
  API_NAMES,
  CACHE_TTL,
} from '../src';

describe('Type guards', () => {
  describe('isFacilityCategory', () => {
    it('should accept valid categories', () => {
      for (const cat of FACILITY_CATEGORIES) {
        expect(isFacilityCategory(cat)).toBe(true);
      }
    });

    it('should reject invalid values', () => {
      expect(isFacilityCategory('unknown')).toBe(false);
      expect(isFacilityCategory(null)).toBe(false);
      expect(isFacilityCategory(undefined)).toBe(false);
      expect(isFacilityCategory(42)).toBe(false);
    });
  });

  describe('isAirQualityGrade', () => {
    it('should accept all 4 grades', () => {
      expect(isAirQualityGrade('good')).toBe(true);
      expect(isAirQualityGrade('moderate')).toBe(true);
      expect(isAirQualityGrade('bad')).toBe(true);
      expect(isAirQualityGrade('veryBad')).toBe(true);
    });

    it('should reject other strings', () => {
      expect(isAirQualityGrade('GOOD')).toBe(false);
      expect(isAirQualityGrade('excellent')).toBe(false);
    });
  });

  describe('isAdminRole', () => {
    it('should accept superadmin and admin', () => {
      expect(isAdminRole('superadmin')).toBe(true);
      expect(isAdminRole('admin')).toBe(true);
    });

    it('should reject other roles', () => {
      expect(isAdminRole('user')).toBe(false);
      expect(isAdminRole('root')).toBe(false);
    });
  });

  describe('isTradeType', () => {
    it('should accept sale and rent', () => {
      expect(isTradeType('sale')).toBe(true);
      expect(isTradeType('rent')).toBe(true);
    });
  });

  describe('isPricePeriod', () => {
    it('should accept 3m/6m/12m', () => {
      expect(isPricePeriod('3m')).toBe(true);
      expect(isPricePeriod('6m')).toBe(true);
      expect(isPricePeriod('12m')).toBe(true);
      expect(isPricePeriod('1m')).toBe(false);
    });
  });

  describe('isKoreanCoordinate', () => {
    it('should accept Seoul coordinates', () => {
      expect(isKoreanCoordinate(37.5665, 126.978)).toBe(true);
    });

    it('should accept Jeju coordinates', () => {
      expect(isKoreanCoordinate(33.5, 126.5)).toBe(true);
    });

    it('should reject US coordinates', () => {
      expect(isKoreanCoordinate(40.7, -74.0)).toBe(false);
    });

    it('should reject coordinates outside Korea', () => {
      expect(isKoreanCoordinate(0, 0)).toBe(false);
      expect(isKoreanCoordinate(50, 130)).toBe(false);
    });
  });
});

describe('Constants', () => {
  it('FACILITY_CATEGORIES should have 6 items in expected order', () => {
    expect(FACILITY_CATEGORIES).toEqual([
      'hospital',
      'pharmacy',
      'school',
      'park',
      'public',
      'transit',
    ]);
  });

  it('AREA_RANGES should be in ascending order', () => {
    for (let i = 1; i < AREA_RANGES.length; i++) {
      expect(AREA_RANGES[i].min).toBeGreaterThanOrEqual(AREA_RANGES[i - 1].min);
    }
  });

  it('AIR_QUALITY_GRADE_THRESHOLDS should be sorted ascending', () => {
    for (let i = 1; i < AIR_QUALITY_GRADE_THRESHOLDS.length; i++) {
      expect(AIR_QUALITY_GRADE_THRESHOLDS[i].max).toBeGreaterThan(
        AIR_QUALITY_GRADE_THRESHOLDS[i - 1].max,
      );
    }
  });

  it('SCORE_CATEGORIES should have 6 items', () => {
    expect(SCORE_CATEGORIES).toHaveLength(6);
  });

  it('numeric policy constants should be positive', () => {
    expect(MAX_CANDIDATES).toBe(5);
    expect(MAX_ALIAS_LENGTH).toBe(30);
    expect(MAX_SEARCH_QUERY_LENGTH).toBe(100);
    expect(LOW_RELIABILITY_TRADE_COUNT).toBe(5);
    expect(JWT_EXPIRES_SECONDS).toBe(3600);
    expect(PASSWORD_POLICY.minLength).toBe(12);
    expect(LOGIN_LOCK_POLICY.maxFailedAttempts).toBe(5);
    expect(LOGIN_LOCK_POLICY.lockDurationMinutes).toBe(15);
    expect(HTTP_CLIENT_POLICY.timeoutMs).toBe(5000);
    expect(HTTP_CLIENT_POLICY.retries).toBe(3);
    expect(HTTP_CLIENT_POLICY.backoffMs).toEqual([100, 500, 2000]);
    expect(RATE_LIMIT_PER_MINUTE.search).toBe(60);
    expect(RATE_LIMIT_PER_MINUTE.report).toBe(10);
    expect(RATE_LIMIT_PER_MINUTE.admin).toBe(100);
  });

  it('ADMIN_ROLES should contain expected values', () => {
    expect(ADMIN_ROLES).toEqual(['superadmin', 'admin']);
  });

  it('API_NAMES should have 6 entries', () => {
    expect(Object.keys(API_NAMES)).toHaveLength(6);
  });

  it('CACHE_TTL should match documented policy', () => {
    expect(CACHE_TTL.realEstate).toBe(24 * 60 * 60 * 1000);
    expect(CACHE_TTL.facility).toBe(7 * 24 * 60 * 60 * 1000);
    expect(CACHE_TTL.airQuality).toBe(60 * 60 * 1000);
    expect(CACHE_TTL.weather).toBe(60 * 60 * 1000);
    expect(CACHE_TTL.regionCode).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
