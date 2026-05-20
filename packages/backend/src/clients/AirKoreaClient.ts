import { BaseHttpClient } from './BaseHttpClient';
import { API_CONFIG } from '../config/apiKeys';
import { API_NAMES, AirQualityData, AirQualityGrade } from '@neighborhood-report/shared';

interface RawAirItem {
  stationName: string;
  pm10Value: string;
  pm25Value: string;
  o3Value: string;
  khaiValue: string;
  dataTime: string;
}

/**
 * 한국환경공단 에어코리아 API.
 * 시도 단위 실시간 측정값 조회 후 시군구명과 같은(또는 가장 비슷한) 측정소 사용.
 */
export class AirKoreaClient extends BaseHttpClient {
  protected baseUrl = API_CONFIG.airkorea.baseUrl;

  /**
   * 시도 단위 측정소 목록 조회. sggName이 주어지면 측정소명 매칭 우선.
   */
  async fetchByRegion(sidoName: string, sggName?: string | null): Promise<AirQualityData | null> {
    const data = await this.get<{ response?: { body?: { items?: RawAirItem[] } } }>(
      '/getCtprvnRltmMesureDnsty',
      {
        apiName: API_NAMES.airKorea,
        params: {
          serviceKey: API_CONFIG.serviceKey,
          returnType: 'json',
          numOfRows: 200,
          pageNo: 1,
          sidoName,
          ver: '1.0',
        },
      },
    );

    const items = data.response?.body?.items;
    if (!Array.isArray(items) || items.length === 0) return null;

    let chosen: RawAirItem | undefined;
    if (sggName) {
      // 1) 시군구명을 측정소명에 포함하는 것 우선 (예: "강남구" → "측정소명에 강남" 포함 - 자치구는 보통 같은 이름)
      const cleanSgg = sggName.replace(/구$|군$|시$/, '');
      chosen = items.find((it) => it.stationName.includes(cleanSgg));
      // 2) 시군구명 prefix 매칭
      if (!chosen) {
        chosen = items.find((it) => it.stationName.startsWith(cleanSgg));
      }
    }
    // 3) 첫 번째 측정소 fallback
    if (!chosen) chosen = items[0];

    const khai = parseFloat(chosen.khaiValue);
    return {
      stationName: chosen.stationName,
      pm10: parseFloat(chosen.pm10Value) || 0,
      pm25: parseFloat(chosen.pm25Value) || 0,
      ozone: parseFloat(chosen.o3Value) || 0,
      overallIndex: Number.isFinite(khai) ? khai : 0,
      grade: this.classifyGrade(khai),
      measuredAt: chosen.dataTime,
    };
  }

  classifyGrade(khai: number): AirQualityGrade {
    if (!Number.isFinite(khai)) return 'moderate';
    if (khai <= 50) return 'good';
    if (khai <= 100) return 'moderate';
    if (khai <= 250) return 'bad';
    return 'veryBad';
  }
}
