import { BaseHttpClient } from './BaseHttpClient';
import { API_CONFIG } from '../config/apiKeys';
import { API_NAMES, TradeDetail } from '@neighborhood-report/shared';

interface RawTradeItem {
  aptNm?: string;
  buildYear?: number | string;
  dealAmount?: string;
  dealDay?: number | string;
  dealMonth?: number | string;
  dealYear?: number | string;
  excluUseAr?: number | string;
  floor?: number | string;
}

interface MolitJsonResponse {
  response?: {
    body?: {
      items?: { item?: RawTradeItem | RawTradeItem[] } | string;
      totalCount?: number;
    };
  };
}

export class MolitTradeClient extends BaseHttpClient {
  protected baseUrl = API_CONFIG.molitAptTrade.baseUrl;

  async fetchMonth(sggCode: string, dealYmd: string, numOfRows = 1000): Promise<TradeDetail[]> {
    const data = await this.get<MolitJsonResponse | string>('/getRTMSDataSvcAptTrade', {
      apiName: API_NAMES.molitTrade,
      // 공공데이터포털은 axios의 Accept 헤더 따라 JSON 또는 XML 반환.
      // 응답이 string이면 JSON.parse 시도.
      responseType: 'text',
      params: {
        serviceKey: API_CONFIG.serviceKey,
        LAWD_CD: sggCode,
        DEAL_YMD: dealYmd,
        numOfRows,
        pageNo: 1,
      },
    });

    let parsed: MolitJsonResponse;
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('{')) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          return [];
        }
      } else if (trimmed.startsWith('<')) {
        return this.parseXmlTrades(trimmed);
      } else {
        return [];
      }
    } else {
      parsed = data;
    }

    const items = parsed.response?.body?.items;
    if (!items || typeof items === 'string') return [];
    const itemList = Array.isArray(items.item) ? items.item : items.item ? [items.item] : [];
    return itemList.map((it) => this.toTradeDetail(it)).filter((t): t is TradeDetail => t !== null);
  }

  async fetchRange(sggCode: string, monthsBack: number): Promise<TradeDetail[]> {
    const months = this.lastNMonths(monthsBack);
    const results = await Promise.allSettled(
      months.map((ymd) => this.fetchMonth(sggCode, ymd)),
    );
    const all: TradeDetail[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') all.push(...r.value);
    }
    return all;
  }

  private toTradeDetail(it: RawTradeItem): TradeDetail | null {
    const dealAmountStr = String(it.dealAmount ?? '').replace(/,/g, '');
    const price = parseInt(dealAmountStr, 10);
    if (!Number.isFinite(price)) return null;
    const dealYear = String(it.dealYear ?? '');
    const dealMonth = String(it.dealMonth ?? '');
    if (!dealYear || !dealMonth) return null;
    return {
      tradeMonth: `${dealYear}-${dealMonth.padStart(2, '0')}`,
      buildingName: String(it.aptNm ?? ''),
      exclusiveArea: parseFloat(String(it.excluUseAr ?? '0')) || 0,
      price,
      floor: parseInt(String(it.floor ?? '0'), 10) || 0,
      buildYear: parseInt(String(it.buildYear ?? '0'), 10) || 0,
      tradeType: 'sale',
    };
  }

  private parseXmlTrades(xml: string): TradeDetail[] {
    const trades: TradeDetail[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const get = (tag: string): string | undefined => {
        const m = new RegExp(`<${tag}>([^<]*)<\\/${tag}>`).exec(item);
        return m ? m[1].trim() : undefined;
      };
      const td = this.toTradeDetail({
        aptNm: get('aptNm'),
        buildYear: get('buildYear'),
        dealAmount: get('dealAmount'),
        dealDay: get('dealDay'),
        dealMonth: get('dealMonth'),
        dealYear: get('dealYear'),
        excluUseAr: get('excluUseAr'),
        floor: get('floor'),
      });
      if (td) trades.push(td);
    }
    return trades;
  }

  private lastNMonths(n: number): string[] {
    const months: string[] = [];
    const now = new Date();
    const lagMonths = 1;
    for (let i = 0; i < n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i - lagMonths, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${y}${m}`);
    }
    return months;
  }
}
