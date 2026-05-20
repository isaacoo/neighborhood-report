import {
  EnvironmentResult,
  InfraResult,
  PriceSummary,
  Report,
  SafetyResult,
  ScoreResult,
} from '@neighborhood-report/shared';
import type { TransitResult } from './TransitAnalyzer';

export type ReportSummaries = {
  price?: PriceSummary;
  infra?: InfraResult;
  environment?: EnvironmentResult;
  transit?: TransitResult;
  safety?: SafetyResult;
};

export class ReportComposer {
  compose(
    regionInfo: { regionCode: string; regionName: string; parentRegionName: string },
    scoreResult: ScoreResult,
    usedApis: string[],
    summaries: ReportSummaries,
  ): Report & { summaries: ReportSummaries } {
    return {
      regionCode: regionInfo.regionCode,
      regionName: regionInfo.regionName,
      parentRegionName: regionInfo.parentRegionName,
      scoreResult,
      dataTimestamp: scoreResult.dataTimestamp,
      usedApis,
      disclaimer:
        '본 리포트는 공공 데이터에 기반한 참고 자료입니다. 부동산 투자 추천이나 절대적 판단을 제공하지 않습니다. 데이터 부족 항목은 임의의 낮은 점수를 부여하지 않습니다.',
      summaries,
    };
  }
}
