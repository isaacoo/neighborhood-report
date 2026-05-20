/** 실거래가 조회 기간 */
export type PricePeriod = '3m' | '6m' | '12m';

/** 거래 유형 */
export type TradeType = 'sale' | 'rent';

/** 면적대별 가격 그룹 */
export interface AreaPriceGroup {
  areaRange: string;
  minPrice: number;
  medianPrice: number;
  maxPrice: number;
  tradeCount: number;
  isLowReliability: boolean;
}

/** 실거래가 요약 */
export interface PriceSummary {
  regionCode: string;
  period: PricePeriod;
  tradeType: TradeType;
  areaGroups: AreaPriceGroup[];
  dataTimestamp: string;
}

/** 개별 거래 상세 */
export interface TradeDetail {
  tradeMonth: string;
  buildingName: string;
  exclusiveArea: number;
  price: number;
  floor: number;
  buildYear: number;
  tradeType: TradeType;
}
