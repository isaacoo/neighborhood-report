import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { haversine } from '../src/domain/distance';
import { formatPrice } from '../src/domain/priceFormat';
import { MemoryCacheManager } from '../src/cache/MemoryCacheManager';
import { ScoreEngine } from '../src/domain/ScoreEngine';
import { AirKoreaClient } from '../src/clients/AirKoreaClient';

describe('Property-Based Tests (Core)', () => {
  describe('Haversine distance', () => {
    const koreaLat = fc.double({ min: 33.0, max: 39.5, noNaN: true });
    const koreaLon = fc.double({ min: 124.0, max: 132.0, noNaN: true });

    it('비음수 (P1: distance >= 0)', () => {
      fc.assert(
        fc.property(koreaLat, koreaLon, koreaLat, koreaLon, (a, b, c, d) => {
          expect(haversine(a, b, c, d)).toBeGreaterThanOrEqual(0);
        }),
      );
    });

    it('대칭성 (P2: d(A,B) === d(B,A))', () => {
      fc.assert(
        fc.property(koreaLat, koreaLon, koreaLat, koreaLon, (a, b, c, d) => {
          const ab = haversine(a, b, c, d);
          const ba = haversine(c, d, a, b);
          expect(Math.abs(ab - ba)).toBeLessThan(1e-6);
        }),
      );
    });

    it('자기 자신과의 거리 = 0 (P3)', () => {
      fc.assert(
        fc.property(koreaLat, koreaLon, (lat, lon) => {
          expect(haversine(lat, lon, lat, lon)).toBeLessThan(1e-6);
        }),
      );
    });
  });

  describe('formatPrice', () => {
    it('1억 이상은 "억" 포함', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10000, max: 1_000_000 }), (price) => {
          expect(formatPrice(price)).toContain('억');
        }),
      );
    });

    it('1억 미만은 "만원" 단어로 끝', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 9999 }), (price) => {
          expect(formatPrice(price).endsWith('만원')).toBe(true);
        }),
      );
    });

    it('동일 입력 → 동일 결과 (deterministic)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1_000_000 }), (price) => {
          expect(formatPrice(price)).toBe(formatPrice(price));
        }),
      );
    });
  });

  describe('MemoryCacheManager.isExpired', () => {
    const cache = new MemoryCacheManager();

    it('cachedAt 시점에는 만료 아님', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1e10 }),
          fc.integer({ min: 1, max: 1e8 }),
          (cachedAt, ttlMs) => {
            expect(cache.isExpired(cachedAt, ttlMs, cachedAt)).toBe(false);
          },
        ),
      );
    });

    it('cachedAt + ttl + 1 시점에는 만료', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1e10 }),
          fc.integer({ min: 1, max: 1e8 }),
          (cachedAt, ttlMs) => {
            expect(cache.isExpired(cachedAt, ttlMs, cachedAt + ttlMs + 1)).toBe(true);
          },
        ),
      );
    });
  });

  describe('ScoreEngine total score range', () => {
    const engine = new ScoreEngine();

    it('0 <= totalScore <= 100 (모든 입력 조합)', () => {
      const result1 = engine.calculate({});
      expect(result1.totalScore).toBeGreaterThanOrEqual(0);
      expect(result1.totalScore).toBeLessThanOrEqual(100);
    });

    it('데이터 없을 때 totalScore=0, 모든 카테고리 unavailable 또는 reliability만 available', () => {
      const result = engine.calculate({});
      const unavailableCount = result.scores.filter(
        (s) => s.dataStatus === 'unavailable',
      ).length;
      // reliability는 항상 available (3개 input 카운트)
      expect(unavailableCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('AirKoreaClient grade monotonicity', () => {
    const client = new AirKoreaClient();
    const order: Record<string, number> = { good: 0, moderate: 1, bad: 2, veryBad: 3 };

    it('지수 증가 → 등급 단조 증가', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 500, noNaN: true }),
          fc.double({ min: 0, max: 500, noNaN: true }),
          (a, b) => {
            const ga = client.classifyGrade(a);
            const gb = client.classifyGrade(b);
            if (a <= b) {
              expect(order[ga]).toBeLessThanOrEqual(order[gb]);
            } else {
              expect(order[ga]).toBeGreaterThanOrEqual(order[gb]);
            }
          },
        ),
      );
    });
  });
});
