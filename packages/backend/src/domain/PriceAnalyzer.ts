import {
  AreaPriceGroup,
  AREA_RANGES,
  LOW_RELIABILITY_TRADE_COUNT,
  PriceSummary,
  TradeDetail,
  PricePeriod,
} from '@neighborhood-report/shared';
import { MolitTradeClient } from '../clients/MolitTradeClient';
import { MemoryCacheManager } from '../cache/MemoryCacheManager';
import { CACHE_TTL } from '@neighborhood-report/shared';

export class PriceAnalyzer {
  constructor(
    private molit: MolitTradeClient,
    private cache: MemoryCacheManager,
  ) {}

  async analyzeSale(sggCode: string, period: PricePeriod): Promise<PriceSummary> {
    const monthsBack = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const { data: trades, cachedAt } = await this.cache.getOrFetch(
      { apiName: 'molit.apt-trade', regionCode: sggCode, paramsHash: period },
      CACHE_TTL.realEstate,
      () => this.molit.fetchRange(sggCode, monthsBack),
    );

    return {
      regionCode: sggCode,
      period,
      tradeType: 'sale',
      areaGroups: this.groupByArea(trades),
      dataTimestamp: cachedAt,
    };
  }

  async listTrades(sggCode: string, period: PricePeriod): Promise<TradeDetail[]> {
    const monthsBack = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const { data } = await this.cache.getOrFetch(
      { apiName: 'molit.apt-trade', regionCode: sggCode, paramsHash: period },
      CACHE_TTL.realEstate,
      () => this.molit.fetchRange(sggCode, monthsBack),
    );
    return data.sort((a, b) => b.tradeMonth.localeCompare(a.tradeMonth));
  }

  groupByArea(trades: TradeDetail[]): AreaPriceGroup[] {
    return AREA_RANGES.map((range) => {
      const inRange = trades.filter(
        (t) => t.exclusiveArea >= range.min && t.exclusiveArea < range.max,
      );
      const prices = inRange.map((t) => t.price).sort((a, b) => a - b);
      if (prices.length === 0) {
        return {
          areaRange: range.label,
          minPrice: 0,
          medianPrice: 0,
          maxPrice: 0,
          tradeCount: 0,
          isLowReliability: true,
        };
      }
      const median =
        prices.length % 2 === 1
          ? prices[Math.floor(prices.length / 2)]
          : Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2);
      return {
        areaRange: range.label,
        minPrice: prices[0],
        medianPrice: median,
        maxPrice: prices[prices.length - 1],
        tradeCount: prices.length,
        isLowReliability: prices.length < LOW_RELIABILITY_TRADE_COUNT,
      };
    });
  }
}
