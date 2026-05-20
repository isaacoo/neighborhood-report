/** 지역 검색 결과 (Search_Engine 출력) */
export interface RegionSearchResult {
  /** 10자리 법정동 코드 */
  regionCode: string;
  /** 5자리 시군구 코드 (실거래가 API 호출용) */
  sggCode: string;
  /** 동/리 이름 */
  regionName: string;
  /** 상위 행정구역 (예: "서울특별시 강남구") */
  parentRegionName: string;
  /** 전체 주소 */
  fullAddress: string;
  /** 중심 좌표 (가용한 경우) */
  latitude: number | null;
  longitude: number | null;
}

/** 검색 응답 (대체 검색어 안내 포함) */
export interface SearchResponse {
  results: RegionSearchResult[];
  suggestions: string[];
}
