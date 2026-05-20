import { Report } from '@neighborhood-report/shared';

export class ComparisonEngine {
  /** 카테고리 기준 내림차순 정렬 (안정 정렬) */
  sortByCategory(reports: Report[], category: string): Report[] {
    return [...reports]
      .map((r, idx) => ({ r, idx, score: this.findScore(r, category) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.idx - b.idx; // 안정 정렬
      })
      .map((x) => x.r);
  }

  /** 각 후보지의 강점/약점 식별 */
  identifyStrengthWeakness(report: Report): {
    strongest: string | null;
    weakest: string | null;
  } {
    const available = report.scoreResult.scores.filter(
      (s) => s.dataStatus === 'available',
    );
    if (available.length === 0) return { strongest: null, weakest: null };
    const sorted = [...available].sort((a, b) => b.score - a.score);
    return {
      strongest: sorted[0].category,
      weakest: sorted[sorted.length - 1].category,
    };
  }

  /** 카테고리별 가장 우수한 후보지 식별 */
  highlightsByCategory(reports: Report[]): Record<string, string> {
    const out: Record<string, string> = {};
    if (reports.length === 0) return out;
    const categories = reports[0].scoreResult.scores.map((s) => s.category);
    for (const cat of categories) {
      let best: { regionCode: string; score: number } | null = null;
      for (const r of reports) {
        const s = r.scoreResult.scores.find(
          (x) => x.category === cat && x.dataStatus === 'available',
        );
        if (s && (!best || s.score > best.score)) {
          best = { regionCode: r.regionCode, score: s.score };
        }
      }
      if (best) out[cat] = best.regionCode;
    }
    return out;
  }

  private findScore(report: Report, category: string): number {
    const s = report.scoreResult.scores.find((x) => x.category === category);
    return s && s.dataStatus === 'available' ? s.score : -1;
  }
}
