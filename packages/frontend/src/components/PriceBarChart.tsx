import type { AreaPriceGroup } from '@neighborhood-report/shared';
import { formatPrice } from '../infrastructure/format';

interface Props {
  areaGroups: AreaPriceGroup[];
}

/**
 * 면적대별 가격 범위를 수평 bar chart로 시각화.
 * 최저~최고 범위를 bar로, 중앙값을 마커로 표시.
 */
function PriceBarChart({ areaGroups }: Props) {
  const validGroups = areaGroups.filter((g) => g.tradeCount > 0);
  if (validGroups.length === 0) return null;

  // 전체 가격 범위 (bar 스케일링용)
  const allPrices = validGroups.flatMap((g) => [g.minPrice, g.maxPrice]);
  const globalMin = Math.min(...allPrices);
  const globalMax = Math.max(...allPrices);
  const range = globalMax - globalMin || 1;

  const toPercent = (v: number) => ((v - globalMin) / range) * 100;

  return (
    <div style={{ marginTop: 16 }}>
      {validGroups.map((g) => {
        const left = toPercent(g.minPrice);
        const right = toPercent(g.maxPrice);
        const width = right - left;
        const medianPos = toPercent(g.medianPrice);

        return (
          <div key={g.areaRange} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                {g.areaRange}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                {g.tradeCount}건{g.isLowReliability ? ' ⚠️' : ''}
              </span>
            </div>
            <div
              style={{
                position: 'relative',
                height: 24,
                background: '#f1f5f9',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {/* Range bar */}
              <div
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  width: `${Math.max(width, 1)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #93c5fd, #3b82f6)',
                  borderRadius: 6,
                  opacity: 0.7,
                }}
              />
              {/* Median marker */}
              <div
                style={{
                  position: 'absolute',
                  left: `${medianPos}%`,
                  top: 2,
                  bottom: 2,
                  width: 3,
                  background: '#1d4ed8',
                  borderRadius: 2,
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>
                {formatPrice(g.minPrice)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
                중앙 {formatPrice(g.medianPrice)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>
                {formatPrice(g.maxPrice)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PriceBarChart;
