import {
  CategoryScore,
  PriceSummary,
  InfraResult,
  EnvironmentResult,
  ScoreResult,
} from '@neighborhood-report/shared';
import type { TransitResult } from './TransitAnalyzer';
import type { SafetyResult } from '@neighborhood-report/shared';

interface ScoreInputs {
  price?: PriceSummary;
  infra?: InfraResult;
  environment?: EnvironmentResult;
  transit?: TransitResult;
  safety?: SafetyResult & { score: CategoryScore };
}

/** 종합 점수 합산에 들어가는 카테고리 (reliability 제외). */
const TOTAL_SCORE_CATEGORIES = [
  'housing',
  'infrastructure',
  'transit',
  'environment',
  'safety',
] as const;

export class ScoreEngine {
  /** 5개 카테고리 가중치 (합 1.0). reliability는 별도 메타. */
  private readonly defaultWeights: Record<string, number> = {
    housing: 0.25,
    infrastructure: 0.20,
    transit: 0.20,
    environment: 0.15,
    safety: 0.20,
  };

  calculate(inputs: ScoreInputs): ScoreResult {
    const allCategories = [...TOTAL_SCORE_CATEGORIES, 'reliability'];
    const scores: CategoryScore[] = allCategories.map((cat) => this.scoreFor(cat, inputs));

    let weighted = 0;
    let totalWeight = 0;
    for (const s of scores) {
      if (s.dataStatus !== 'available') continue;
      if (s.category === 'reliability') continue;
      const w = this.defaultWeights[s.category];
      if (typeof w !== 'number') continue;
      weighted += (s.score / s.maxScore) * w;
      totalWeight += w;
    }
    const total = totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : 0;

    // reliability는 강점/약점 산정에서 제외
    const totalCategoryScores = scores.filter(
      (s) => s.category !== 'reliability' && s.dataStatus === 'available',
    );
    const sortedDesc = [...totalCategoryScores].sort((a, b) => b.score - a.score);
    const sortedAsc = [...totalCategoryScores].sort((a, b) => a.score - b.score);

    const strengths = sortedDesc.slice(0, Math.min(2, sortedDesc.length)).map((s) => `${s.category}: ${s.score}점`);
    const cautions = sortedAsc.slice(0, Math.min(2, sortedAsc.length)).map((s) => `${s.category}: ${s.score}점`);

    const insufficient = scores
      .filter((s) => s.category !== 'reliability' && s.dataStatus !== 'available')
      .map((s) => s.category);

    return {
      regionCode: inputs.price?.regionCode ?? inputs.infra?.regionCode ?? '',
      totalScore: total,
      scores,
      strengths,
      cautions,
      insufficientData: insufficient,
      weightVersion: 'v1.2.0-mvp',
      dataTimestamp: new Date().toISOString(),
    };
  }

  private scoreFor(category: string, inputs: ScoreInputs): CategoryScore {
    switch (category) {
      case 'housing':
        return this.scoreHousing(inputs.price);
      case 'infrastructure':
        return this.scoreInfra(inputs.infra);
      case 'transit':
        return inputs.transit?.score ?? this.unavailable('transit', '교통 데이터 없음');
      case 'environment':
        return this.scoreEnvironment(inputs.environment);
      case 'safety':
        return inputs.safety?.score ?? this.unavailable('safety', '안전 데이터 없음');
      case 'reliability':
        return this.scoreReliability(inputs);
      default:
        return this.unavailable(category, 'unknown');
    }
  }

  /**
   * 주거비: 대표 면적대 중앙값 기반. 5억=100점, 30억=0점 선형 보간.
   * 거래량 30건 미만 신뢰도 페널티 -10점.
   */
  private scoreHousing(price?: PriceSummary): CategoryScore {
    if (!price) return this.unavailable('housing', '실거래가 데이터 없음');
    const totalCount = price.areaGroups.reduce((s, g) => s + g.tradeCount, 0);
    if (totalCount === 0) return this.unavailable('housing', '거래 데이터 없음');

    const preferOrder = ['84~135㎡', '59~84㎡', '~59㎡', '135㎡~'];
    let representative: { areaRange: string; medianPrice: number; tradeCount: number } | null = null;
    for (const target of preferOrder) {
      const g = price.areaGroups.find((x) => x.areaRange === target && x.tradeCount > 0);
      if (g) {
        representative = { areaRange: g.areaRange, medianPrice: g.medianPrice, tradeCount: g.tradeCount };
        break;
      }
    }
    if (!representative) return this.unavailable('housing', '대표 면적대 거래 없음');

    const LOW = 50000;
    const HIGH = 300000;
    const median = representative.medianPrice;
    let raw = 100;
    if (median > HIGH) raw = 0;
    else if (median > LOW) raw = 100 - ((median - LOW) / (HIGH - LOW)) * 100;

    const reliabilityPenalty = totalCount < 30 ? 10 : 0;
    const score = Math.max(0, Math.round(raw - reliabilityPenalty));

    return {
      category: 'housing',
      score,
      maxScore: 100,
      rationale: `대표 면적 ${representative.areaRange} 중앙값 ${this.formatManWon(median)} (거래 ${totalCount}건)`,
      dataStatus: 'available',
    };
  }

  private scoreInfra(infra?: InfraResult): CategoryScore {
    if (!infra) return this.unavailable('infrastructure', '데이터 없음');
    const hospital = infra.accessibilityScores.find((s) => s.category === 'hospital');
    if (!hospital || hospital.dataStatus === 'unavailable') {
      return this.unavailable('infrastructure', '병원 데이터 없음');
    }
    return {
      category: 'infrastructure',
      score: hospital.score,
      maxScore: 100,
      rationale: `의료시설 - ${hospital.rationale}`,
      dataStatus: hospital.dataStatus,
    };
  }

  private scoreEnvironment(env?: EnvironmentResult): CategoryScore {
    if (!env || env.airQuality.stationName === '데이터 없음') {
      return this.unavailable('environment', '대기질 데이터 없음');
    }
    const grade = env.airQuality.grade;
    const khai = env.airQuality.overallIndex;
    const raw = Math.max(0, Math.min(100, 100 - (khai / 250) * 100));
    const score = Math.round(raw);
    return {
      category: 'environment',
      score,
      maxScore: 100,
      rationale: `대기질 ${this.gradeLabel(grade)} (KHAI ${khai}, 측정소 ${env.airQuality.stationName})`,
      dataStatus: 'available',
    };
  }

  private scoreReliability(inputs: ScoreInputs): CategoryScore {
    const have = [inputs.price, inputs.infra, inputs.environment, inputs.transit, inputs.safety].filter(Boolean).length;
    return {
      category: 'reliability',
      score: Math.round((have / 5) * 100),
      maxScore: 100,
      rationale: `데이터 출처 ${have}/5 (메타 정보 - 종합 점수 합산 제외)`,
      dataStatus: 'available',
    };
  }

  private unavailable(category: string, reason: string): CategoryScore {
    return { category, score: 0, maxScore: 100, rationale: reason, dataStatus: 'unavailable' };
  }

  private formatManWon(v: number): string {
    if (v >= 10000) {
      const eok = Math.floor(v / 10000);
      const rem = v % 10000;
      return rem ? `${eok}억 ${rem.toLocaleString()}만원` : `${eok}억`;
    }
    return `${v.toLocaleString()}만원`;
  }

  private gradeLabel(grade: string): string {
    return grade === 'good' ? '좋음' : grade === 'moderate' ? '보통' : grade === 'bad' ? '나쁨' : '매우나쁨';
  }
}
