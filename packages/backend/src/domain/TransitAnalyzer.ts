import { CategoryScore } from '@neighborhood-report/shared';
import { haversine } from './distance';
import { SEOUL_STATIONS, Station } from './subwayStations';

export interface TransitResult {
  regionCode: string;
  /** 반경 내 가장 가까운 역들 (최대 5개) */
  nearestStations: Array<{ name: string; lines: string[]; distance: number }>;
  /** 반경별 역 수 */
  countWithin500m: number;
  countWithin1km: number;
  countWithin2km: number;
  /** 접근성 점수 */
  score: CategoryScore;
  dataTimestamp: string;
  /** 데이터 출처 라벨 */
  dataSource: string;
}

export class TransitAnalyzer {
  /**
   * 정적 서울 지하철역 좌표 데이터 기반 교통 접근성 분석.
   * Post-MVP에서 공공 API 또는 GTFS 데이터로 확장.
   */
  analyze(regionCode: string, centerLat: number, centerLon: number): TransitResult {
    const stationDistances = SEOUL_STATIONS.map((s) => ({
      station: s,
      distance: Math.round(haversine(centerLat, centerLon, s.latitude, s.longitude)),
    })).sort((a, b) => a.distance - b.distance);

    const within500 = stationDistances.filter((x) => x.distance <= 500);
    const within1k = stationDistances.filter((x) => x.distance <= 1000);
    const within2k = stationDistances.filter((x) => x.distance <= 2000);

    const score = this.scoreTransit(within500.length, within1k.length, within2k.length, stationDistances[0]?.distance ?? Infinity);

    return {
      regionCode,
      nearestStations: stationDistances.slice(0, 5).map((x) => ({
        name: x.station.name,
        lines: x.station.lines,
        distance: x.distance,
      })),
      countWithin500m: within500.length,
      countWithin1km: within1k.length,
      countWithin2km: within2k.length,
      score,
      dataTimestamp: new Date().toISOString(),
      dataSource: '서울 열린데이터광장 지하철역 위치 정보 (정적 번들)',
    };
  }

  private scoreTransit(c500: number, c1k: number, c2k: number, nearestDistance: number): CategoryScore {
    if (c2k === 0) {
      return {
        category: 'transit',
        score: 0,
        maxScore: 100,
        rationale: `2km 내 지하철역 없음 (가장 가까운 역까지 ${Math.round(nearestDistance)}m)`,
        dataStatus: 'insufficient',
      };
    }

    // 가장 가까운 역까지 거리 기반 base score
    let base: number;
    if (nearestDistance <= 300) base = 100;
    else if (nearestDistance <= 500) base = 90;
    else if (nearestDistance <= 800) base = 75;
    else if (nearestDistance <= 1200) base = 55;
    else if (nearestDistance <= 2000) base = 30;
    else base = 10;

    // 환승 가산점: 1km 내 역이 많으면 노선 다양성 ↑
    const transferBonus = Math.min(15, c1k * 2);
    const score = Math.min(100, base + transferBonus);

    return {
      category: 'transit',
      score,
      maxScore: 100,
      rationale: `가장 가까운 역까지 ${Math.round(nearestDistance)}m, 1km 내 ${c1k}개역, 2km 내 ${c2k}개역`,
      dataStatus: 'available',
    };
  }
}
