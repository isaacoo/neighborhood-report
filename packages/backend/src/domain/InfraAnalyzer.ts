import {
  CACHE_TTL,
  CategoryScore,
  FacilityCategory,
  FacilityGroup,
  FacilityItem,
  InfraResult,
} from '@neighborhood-report/shared';
import { HiraHospitalClient, RawHospital } from '../clients/HiraHospitalClient';
import { MemoryCacheManager } from '../cache/MemoryCacheManager';
import { haversine } from './distance';
import { getSggInfo } from './sggCoordinates';

export class InfraAnalyzer {
  constructor(
    private hira: HiraHospitalClient,
    private cache: MemoryCacheManager,
  ) {}

  async analyze(
    sggCode: string,
    centerLat: number,
    centerLon: number,
  ): Promise<InfraResult> {
    const sggInfo = getSggInfo(sggCode);

    const lat = Number.isFinite(centerLat) && centerLat !== 0 ? centerLat : sggInfo?.latitude ?? 37.5665;
    const lon = Number.isFinite(centerLon) && centerLon !== 0 ? centerLon : sggInfo?.longitude ?? 126.978;

    let hospitals: RawHospital[] = [];
    let pharmacies: RawHospital[] = [];
    let dataTimestamp = new Date().toISOString();

    if (sggInfo?.hiraSgguCd) {
      const [hospResult, pharmResult] = await Promise.allSettled([
        this.cache.getOrFetch(
          { apiName: 'hira.hospital', regionCode: sggCode, paramsHash: 'hosp' },
          CACHE_TTL.facility,
          () => this.hira.fetchHospitalsBySgguCd(sggInfo.hiraSgguCd!),
        ),
        this.cache.getOrFetch(
          { apiName: 'hira.pharmacy', regionCode: sggCode, paramsHash: 'pharm' },
          CACHE_TTL.facility,
          () => this.hira.fetchPharmaciesBySgguCd(sggInfo.hiraSgguCd!),
        ),
      ]);
      if (hospResult.status === 'fulfilled') {
        hospitals = hospResult.value.data;
        dataTimestamp = hospResult.value.cachedAt;
      }
      if (pharmResult.status === 'fulfilled') {
        pharmacies = pharmResult.value.data;
      }
    }

    const hospitalGroup = this.toFacilityGroup('hospital', hospitals, lat, lon);
    const pharmacyGroup = this.toFacilityGroup('pharmacy', pharmacies, lat, lon);

    const stubGroup = (cat: FacilityCategory): FacilityGroup => ({
      category: cat,
      radius500m: [],
      radius1km: [],
      radius2km: [],
    });

    const groups: FacilityGroup[] = [
      hospitalGroup,
      pharmacyGroup,
      stubGroup('school'),
      stubGroup('park'),
      stubGroup('public'),
      stubGroup('transit'),
    ];

    const scores: CategoryScore[] = groups.map((g) => this.scoreCategory(g));

    return {
      regionCode: sggCode,
      facilities: groups,
      accessibilityScores: scores,
      dataTimestamp,
    };
  }

  private toFacilityGroup(
    category: FacilityCategory,
    raw: RawHospital[],
    centerLat: number,
    centerLon: number,
  ): FacilityGroup {
    const items: FacilityItem[] = raw
      .map((h) => {
        const lat = parseFloat(h.YPos ?? '');
        const lon = parseFloat(h.XPos ?? '');
        const hasCoord = Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0;
        const distance = hasCoord ? Math.round(haversine(centerLat, centerLon, lat, lon)) : -1;
        return {
          name: h.yadmNm,
          address: h.addr,
          distance,
          latitude: hasCoord ? lat : null,
          longitude: hasCoord ? lon : null,
          isMissingCoords: !hasCoord,
        };
      });
    items.sort((a, b) => {
      if (a.isMissingCoords) return 1;
      if (b.isMissingCoords) return -1;
      return a.distance - b.distance;
    });

    return {
      category,
      radius500m: items.filter((i) => !i.isMissingCoords && i.distance <= 500),
      radius1km: items.filter((i) => !i.isMissingCoords && i.distance <= 1000),
      radius2km: items.filter((i) => !i.isMissingCoords && i.distance <= 2000),
    };
  }

  private scoreCategory(g: FacilityGroup): CategoryScore {
    const c500 = g.radius500m.length;
    const c1k = g.radius1km.length;
    const c2k = g.radius2km.length;
    if (c500 === 0 && c1k === 0 && c2k === 0) {
      return {
        category: g.category,
        score: 0,
        maxScore: 100,
        rationale: '데이터 없음',
        dataStatus: 'unavailable',
      };
    }
    // 가중치: 500m 5점, 1km 2점(500m 초과분), 2km 1점(1km 초과분), cap 100
    const raw = c500 * 5 + (c1k - c500) * 2 + (c2k - c1k) * 1;
    const score = Math.min(100, raw);
    return {
      category: g.category,
      score,
      maxScore: 100,
      rationale: `500m 내 ${c500}곳, 1km 내 ${c1k}곳, 2km 내 ${c2k}곳`,
      dataStatus: c2k > 0 ? 'available' : 'insufficient',
    };
  }
}
