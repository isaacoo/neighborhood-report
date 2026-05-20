/**
 * MVP용 in-memory 캐시 매니저.
 * Post-MVP에서 Redis 기반으로 교체 예정 (interface 동일).
 */
export interface CacheKey {
  apiName: string;
  regionCode: string;
  paramsHash: string;
}

interface Entry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export class MemoryCacheManager {
  private store = new Map<string, Entry<unknown>>();

  private buildKey(key: CacheKey): string {
    return `${key.apiName}:${key.regionCode}:${key.paramsHash}`;
  }

  isExpired(cachedAt: number, ttlMs: number, now: number = Date.now()): boolean {
    return now > cachedAt + ttlMs;
  }

  async getOrFetch<T>(
    key: CacheKey,
    ttlMs: number,
    fetcher: () => Promise<T>,
  ): Promise<{ data: T; isStale: boolean; cachedAt: string }> {
    const k = this.buildKey(key);
    const existing = this.store.get(k) as Entry<T> | undefined;
    const now = Date.now();

    if (existing && !this.isExpired(existing.cachedAt, ttlMs, now)) {
      return {
        data: existing.data,
        isStale: false,
        cachedAt: new Date(existing.cachedAt).toISOString(),
      };
    }

    try {
      const data = await fetcher();
      this.store.set(k, { data, cachedAt: now, expiresAt: now + ttlMs });
      return { data, isStale: false, cachedAt: new Date(now).toISOString() };
    } catch (err) {
      if (existing) {
        // stale fallback
        return {
          data: existing.data,
          isStale: true,
          cachedAt: new Date(existing.cachedAt).toISOString(),
        };
      }
      throw err;
    }
  }

  invalidateByRegion(regionCode: string): number {
    let count = 0;
    for (const [k] of this.store) {
      if (k.includes(`:${regionCode}:`)) {
        this.store.delete(k);
        count++;
      }
    }
    return count;
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
