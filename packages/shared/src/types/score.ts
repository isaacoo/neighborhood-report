import { CategoryScore } from './infra';

/** 종합 점수 결과 */
export interface ScoreResult {
  regionCode: string;
  totalScore: number;
  scores: CategoryScore[];
  strengths: string[];
  cautions: string[];
  insufficientData: string[];
  weightVersion: string;
  dataTimestamp: string;
}

/** 리포트 전체 */
export interface Report {
  regionCode: string;
  regionName: string;
  parentRegionName: string;
  scoreResult: ScoreResult;
  dataTimestamp: string;
  usedApis: string[];
  disclaimer: string;
}
