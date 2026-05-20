import { CACHE_TTL, EnvironmentResult } from '@neighborhood-report/shared';
import { AirKoreaClient } from '../clients/AirKoreaClient';
import { MemoryCacheManager } from '../cache/MemoryCacheManager';
import { extractSidoFromParent, getSggInfo } from './sggCoordinates';

export class EnvironmentAnalyzer {
  constructor(
    private airkorea: AirKoreaClient,
    private cache: MemoryCacheManager,
  ) {}

  async analyze(parentRegionName: string, regionCode: string): Promise<EnvironmentResult> {
    const sggCode = regionCode.substring(0, 5);
    const sggInfo = getSggInfo(sggCode);
    const sido = sggInfo?.sidoName ?? extractSidoFromParent(parentRegionName);
    const sggName = sggInfo ? sggInfo.name.split(' ').slice(-1)[0] : null;

    const { data: air, cachedAt } = await this.cache.getOrFetch(
      { apiName: 'environ.airkorea', regionCode, paramsHash: `${sido}|${sggName ?? ''}` },
      CACHE_TTL.airQuality,
      () => this.airkorea.fetchByRegion(sido, sggName),
    );

    return {
      regionCode,
      airQuality: air ?? {
        stationName: '데이터 없음',
        pm10: 0,
        pm25: 0,
        ozone: 0,
        overallIndex: 0,
        grade: 'moderate',
        measuredAt: cachedAt,
      },
      weather: {
        temperature: 0,
        humidity: 0,
        precipitation: 0,
        windSpeed: 0,
        sky: 'clear',
        forecastDate: cachedAt,
      },
      discomfort: {
        heatWave: false,
        coldWave: false,
        heavyRain: false,
        description: 'MVP에서는 기상 데이터 미제공',
      },
      dataTimestamp: cachedAt,
    };
  }
}
