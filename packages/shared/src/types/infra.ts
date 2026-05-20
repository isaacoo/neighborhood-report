/** 시설 카테고리 */
export type FacilityCategory =
  | 'hospital'
  | 'pharmacy'
  | 'school'
  | 'park'
  | 'public'
  | 'transit';

/** 개별 시설 정보 */
export interface FacilityItem {
  name: string;
  address: string;
  distance: number;
  latitude: number | null;
  longitude: number | null;
  isMissingCoords: boolean;
}

/** 카테고리별 시설 그룹 */
export interface FacilityGroup {
  category: FacilityCategory;
  radius500m: FacilityItem[];
  radius1km: FacilityItem[];
  radius2km: FacilityItem[];
}

/** 카테고리별 점수 */
export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  rationale: string;
  dataStatus: 'available' | 'insufficient' | 'unavailable';
}

/** 생활 인프라 분석 결과 */
export interface InfraResult {
  regionCode: string;
  facilities: FacilityGroup[];
  accessibilityScores: CategoryScore[];
  dataTimestamp: string;
}
