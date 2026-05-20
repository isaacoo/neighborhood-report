import { BaseHttpClient } from './BaseHttpClient';
import { API_CONFIG } from '../config/apiKeys';
import { API_NAMES, RegionSearchResult } from '@neighborhood-report/shared';
import { getSggInfo } from '../domain/sggCoordinates';

interface StanReginRow {
  region_cd: string;
  sido_cd: string;
  sgg_cd: string;
  umd_cd: string;
  ri_cd?: string;
  locatadd_nm: string;
  locatjumin_cd?: string;
  locatjumin_nm?: string;
  locallow_nm: string;
  locathigh_cd?: string;
}

export class RegionCodeClient extends BaseHttpClient {
  protected baseUrl = API_CONFIG.regionCode.baseUrl;

  async search(keyword: string, numOfRows = 30): Promise<RegionSearchResult[]> {
    const data = await this.get<{ StanReginCd?: Array<{ row?: StanReginRow[] }> }>(
      '/getStanReginCdList',
      {
        apiName: API_NAMES.regionCode,
        params: {
          serviceKey: API_CONFIG.serviceKey,
          pageNo: 1,
          numOfRows,
          type: 'json',
          locatadd_nm: keyword,
        },
      },
    );

    const dataList = data.StanReginCd;
    if (!Array.isArray(dataList) || dataList.length < 2) return [];
    const rows = dataList[1]?.row;
    if (!Array.isArray(rows)) return [];

    return rows
      .filter((row) => row.umd_cd && row.umd_cd !== '000')
      .map((row) => {
        const parts = row.locatadd_nm.split(' ');
        const parent = parts.slice(0, 2).join(' ');
        const sggCode = `${row.sido_cd}${row.sgg_cd}`;
        const sggInfo = getSggInfo(sggCode);
        return {
          regionCode: row.region_cd,
          sggCode,
          regionName: row.locallow_nm,
          parentRegionName: parent,
          fullAddress: row.locatadd_nm,
          // 시군구 대표 좌표를 후보지 좌표로 사용 (post-MVP에서 동 단위 좌표로 정밀화)
          latitude: sggInfo?.latitude ?? null,
          longitude: sggInfo?.longitude ?? null,
        };
      });
  }
}
