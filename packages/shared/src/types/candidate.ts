/** 이사 후보지 */
export interface Candidate {
  id: string;
  regionCode: string;
  regionName: string;
  parentRegionName: string;
  alias: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
}

/** 후보지 등록 요청 */
export interface CreateCandidateRequest {
  regionCode: string;
  regionName: string;
  parentRegionName: string;
  alias?: string;
  latitude: number;
  longitude: number;
}

/** 후보지 별칭 수정 요청 */
export interface UpdateCandidateAliasRequest {
  alias: string;
}
