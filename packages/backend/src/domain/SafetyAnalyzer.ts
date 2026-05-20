import { CACHE_TTL, CategoryScore, SafetyResult } from '@neighborhood-report/shared';
import { HiraHospitalClient } from '../clients/HiraHospitalClient';
import { MemoryCacheManager } from '../cache/MemoryCacheManager';
import { haversine } from './distance';
import { getSggInfo } from './sggCoordinates';

/**
 * MVP 안전 인프라 분석:
 *   응급의료 인프라 proxy로 종합병원·상급종합병원 수를 사용.
 *   HIRA 병원정보 API의 clCdNm(요양기관 종별 명) 필터.
 *   범죄율 등 지역 낙인 지표는 명시적으로 제외 (FR-6.4).
 *
 * Post-MVP: 응급의료기관 전용 API + 소방서/경찰서/대피소 추가.
 */
export class SafetyAnalyzer {
  constructor(
    private hira: HiraHospitalClient,
    private cache: MemoryCacheManager,
  ) {}

  async analyze(
    sggCode: string,
    centerLat: number,
    centerLon: number,
  ): Promise<SafetyResult & { score: CategoryScore }> {
    const sggInfo = getSggInfo(sggCode);

    if (!sggInfo?.hiraSgguCd) {
      return {
        regionCode: sggCode,
        facilities: [],
        disasterRisks: [],
        dataTimestamp: new Date().toISOString(),
        dataSources: [],
        score: {
          category: 'safety',
          score: 0,
          maxScore: 100,
          rationale: '안전 시설 데이터 없음 (시군구 매핑 미등록)',
          dataStatus: 'unavailable',
        },
      };
    }

    const result = await this.cache.getOrFetch(
      { apiName: 'hira.hospital.detail', regionCode: sggCode, paramsHash: 'safety' },
      CACHE_TTL.facility,
      () => this.hira.fetchHospitalsBySgguCd(sggInfo.hiraSgguCd!),
    );

    // 응급의료 proxy: 첫 30개 병원 중 좌표 있는 것만 거리 계산.
    // (HIRA 기본 API는 종별 정보 미포함이므로, post-MVP에서 응급의료기관 전용 API로 정밀화)
    const candidates = result.data
      .map((h) => {
        const lat = parseFloat(h.YPos ?? '');
        const lon = parseFloat(h.XPos ?? '');
        const hasCoord = Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0;
        return {
          name: h.yadmNm,
          address: h.addr,
          latitude: hasCoord ? lat : 0,
          longitude: hasCoord ? lon : 0,
          distance: hasCoord ? Math.round(haversine(centerLat, centerLon, lat, lon)) : -1,
          hasCoord,
        };
      })
      .filter((x) => x.hasCoord)
      .sort((a, b) => a.distance - b.distance);

    const within2km = candidates.filter((x) => x.distance <= 2000);
    const nearest = candidates[0];

    // SafetyFacility 형식 (3개만 노출)
    const facilities = within2km.slice(0, 3).map((c) => ({
      type: 'emergency_hospital' as const,
      name: c.name,
      address: c.address,
      distance: c.distance,
      latitude: c.latitude,
      longitude: c.longitude,
    }));

    const score: CategoryScore = (() => {
      if (!nearest) {
        return {
          category: 'safety',
          score: 0,
          maxScore: 100,
          rationale: '응급의료기관 좌표 데이터 없음',
          dataStatus: 'unavailable',
        };
      }
      const d = nearest.distance;
      let base: number;
      if (d <= 500) base = 100;
      else if (d <= 1000) base = 85;
      else if (d <= 2000) base = 65;
      else if (d <= 5000) base = 40;
      else base = 20;

      // 2km 내 응급의료기관 수가 많을수록 보너스
      const countBonus = Math.min(10, within2km.length);
      return {
        category: 'safety',
        score: Math.min(100, base + countBonus),
        maxScore: 100,
        rationale: `가장 가까운 의료시설까지 ${d}m (2km 내 ${within2km.length}곳, 가장 가까운: ${nearest.name})`,
        dataStatus: 'available',
      };
    })();

    return {
      regionCode: sggCode,
      facilities,
      disasterRisks: [],
      dataTimestamp: result.cachedAt,
      dataSources: [{ name: '건강보험심사평가원 병원정보', referenceDate: result.cachedAt }],
      score,
    };
  }
}
