interface Point {
  label: string;
  value: number; // 0-100 scale
  available: boolean;
}

interface Props {
  points: Point[];
  size?: number;
}

/**
 * Pentagon/hexagon radar chart (mockup style).
 * Soft blue fill, subtle grid.
 */
function RadarChart({ points, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const n = points.length;

  // Polar to Cartesian (start at top, clockwise)
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, r: number) => {
    const a = angle(i);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  };

  // Grid (4 layers)
  const gridLayers = [0.25, 0.5, 0.75, 1];

  // Data polygon (treat unavailable as 0)
  const dataPath = points
    .map((p, i) => {
      const r = (p.available ? p.value : 0) / 100 * radius;
      const { x, y } = point(i, r);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';

  // Outer pentagon points (for labels)
  const labelRadius = radius + 26;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="레이더 차트">
      {/* Grid layers */}
      {gridLayers.map((k, idx) => {
        const path =
          points
            .map((_, i) => {
              const { x, y } = point(i, radius * k);
              return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' ') + ' Z';
        return (
          <path
            key={idx}
            d={path}
            fill={idx === gridLayers.length - 1 ? '#fafbfc' : 'none'}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* Spokes */}
      {points.map((_, i) => {
        const { x, y } = point(i, radius);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef0f4" strokeWidth={1} />
        );
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="rgba(59, 130, 246, 0.18)" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => {
        if (!p.available) return null;
        const r = (p.value / 100) * radius;
        const { x, y } = point(i, r);
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#3b82f6" stroke="white" strokeWidth={1.5} />;
      })}

      {/* Labels */}
      {points.map((p, i) => {
        const a = angle(i);
        const x = cx + Math.cos(a) * labelRadius;
        const y = cy + Math.sin(a) * labelRadius;
        return (
          <g key={`l-${i}`}>
            <text
              x={x}
              y={y - 6}
              textAnchor="middle"
              fontSize={11}
              fill="#6b7280"
              fontWeight={500}
            >
              {p.label}
            </text>
            <text
              x={x}
              y={y + 8}
              textAnchor="middle"
              fontSize={13}
              fill={p.available ? '#0b1220' : '#9aa3b2'}
              fontWeight={700}
            >
              {p.available ? p.value : '—'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default RadarChart;
