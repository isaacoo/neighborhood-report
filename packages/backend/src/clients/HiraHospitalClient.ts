import { BaseHttpClient } from './BaseHttpClient';
import { API_CONFIG } from '../config/apiKeys';
import { API_NAMES } from '@neighborhood-report/shared';

export interface RawHospital {
  yadmNm: string;
  addr: string;
  YPos?: string; // 위도
  XPos?: string; // 경도
}

interface HiraJsonResponse {
  response?: {
    body?: {
      items?: { item?: RawItem | RawItem[] } | string;
      totalCount?: number;
    };
  };
}

interface RawItem {
  yadmNm?: string;
  addr?: string;
  YPos?: string | number;
  XPos?: string | number;
}

export class HiraHospitalClient extends BaseHttpClient {
  protected baseUrl = API_CONFIG.hiraHospital.baseUrl;

  /** HIRA 고유 sgguCd로 병원 목록 조회 */
  async fetchHospitalsBySgguCd(hiraSgguCd: string, numOfRows = 500): Promise<RawHospital[]> {
    const data = await this.get<HiraJsonResponse | string>('/getHospBasisList', {
      apiName: API_NAMES.hiraHospital,
      responseType: 'text',
      params: {
        serviceKey: API_CONFIG.serviceKey,
        sgguCd: hiraSgguCd,
        numOfRows,
        pageNo: 1,
        _type: 'json',
      },
    });

    return this.parseResponse(data);
  }

  /** HIRA 고유 sgguCd로 약국 목록 조회 */
  async fetchPharmaciesBySgguCd(hiraSgguCd: string, numOfRows = 500): Promise<RawHospital[]> {
    const data = await this.get<HiraJsonResponse | string>('/getParmBasisList', {
      apiName: API_NAMES.hiraHospital,
      responseType: 'text',
      params: {
        serviceKey: API_CONFIG.serviceKey,
        sgguCd: hiraSgguCd,
        numOfRows,
        pageNo: 1,
        _type: 'json',
      },
    });

    return this.parseResponse(data);
  }

  private parseResponse(data: HiraJsonResponse | string): RawHospital[] {
    let parsed: HiraJsonResponse;
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('{')) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          return [];
        }
      } else if (trimmed.startsWith('<')) {
        return this.parseXml(trimmed);
      } else {
        return [];
      }
    } else {
      parsed = data;
    }

    const items = parsed.response?.body?.items;
    if (!items || typeof items === 'string') return [];
    const itemList = Array.isArray(items.item) ? items.item : items.item ? [items.item] : [];
    return itemList
      .filter((it): it is RawItem => !!it && typeof it === 'object')
      .map((it) => ({
        yadmNm: String(it.yadmNm ?? ''),
        addr: String(it.addr ?? ''),
        YPos: it.YPos !== undefined ? String(it.YPos) : undefined,
        XPos: it.XPos !== undefined ? String(it.XPos) : undefined,
      }));
  }

  private parseXml(xml: string): RawHospital[] {
    const items: RawHospital[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = itemRegex.exec(xml)) !== null) {
      const body = m[1];
      const get = (tag: string): string | undefined => {
        const r = new RegExp(`<${tag}>([^<]*)<\\/${tag}>`).exec(body);
        return r ? r[1].trim() : undefined;
      };
      items.push({
        yadmNm: get('yadmNm') ?? '',
        addr: get('addr') ?? '',
        YPos: get('YPos'),
        XPos: get('XPos'),
      });
    }
    return items;
  }
}
