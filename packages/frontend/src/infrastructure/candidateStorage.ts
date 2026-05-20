import { MAX_CANDIDATES, MAX_ALIAS_LENGTH } from '@neighborhood-report/shared';

export interface StoredCandidate {
  id: string;
  regionCode: string;
  regionName: string;
  parentRegionName: string;
  alias: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

const KEY = 'neighborhood-report:candidates:v1';

function readAll(): StoredCandidate[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: StoredCandidate[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export const candidateStorage = {
  list(): StoredCandidate[] {
    return readAll();
  },

  add(input: {
    regionCode: string;
    regionName: string;
    parentRegionName: string;
    alias?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): StoredCandidate | { error: string } {
    const items = readAll();
    if (items.length >= MAX_CANDIDATES) {
      return { error: `최대 ${MAX_CANDIDATES}개까지 등록 가능합니다.` };
    }
    if (items.some((it) => it.regionCode === input.regionCode)) {
      return { error: '이미 등록된 후보지입니다.' };
    }
    const aliasTrim = (input.alias ?? '').trim();
    if (aliasTrim.length > MAX_ALIAS_LENGTH) {
      return { error: `별칭은 ${MAX_ALIAS_LENGTH}자 이내로 입력해주세요.` };
    }
    const item: StoredCandidate = {
      id: crypto.randomUUID(),
      regionCode: input.regionCode,
      regionName: input.regionName,
      parentRegionName: input.parentRegionName,
      alias: aliasTrim || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      createdAt: new Date().toISOString(),
    };
    items.push(item);
    writeAll(items);
    return item;
  },

  remove(id: string): void {
    const items = readAll().filter((it) => it.id !== id);
    writeAll(items);
  },

  updateAlias(id: string, alias: string): void {
    const items = readAll().map((it) =>
      it.id === id ? { ...it, alias: alias.trim() || null } : it,
    );
    writeAll(items);
  },

  clear(): void {
    window.localStorage.removeItem(KEY);
  },
};
