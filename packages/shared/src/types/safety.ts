/** 안전 시설 유형 */
export type SafetyFacilityType =
  | 'emergency_hospital'
  | 'fire_station'
  | 'police_station'
  | 'shelter'
  | 'disaster_facility';

/** 안전 시설 정보 */
export interface SafetyFacility {
  type: SafetyFacilityType;
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
}

/** 재난 리스크 참고 정보 */
export interface DisasterRisk {
  type: string;
  description: string;
  dataSource: string;
  referenceDate: string;
}

/** 안전 분석 결과 */
export interface SafetyResult {
  regionCode: string;
  facilities: SafetyFacility[];
  disasterRisks: DisasterRisk[];
  dataTimestamp: string;
  dataSources: { name: string; referenceDate: string }[];
}
