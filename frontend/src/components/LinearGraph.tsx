import { GraphOption } from '../types';

type LinearGraphProps = {
  option: GraphOption;
  size?: 'small' | 'large';
};

const VIEW_MIN = -5;
const VIEW_MAX = 5;
const PADDING = 22;
const PLOT_SIZE = 156;

function toSvg(value: number): number {
  return PADDING + ((value - VIEW_MIN) / (VIEW_MAX - VIEW_MIN)) * PLOT_SIZE;
}

function yAt(option: GraphOption, x: number): number {
  return option.slope * x + option.intercept;
}

function getLinePoints(option: GraphOption) {
  const firstY = yAt(option, VIEW_MIN);
  const lastY = yAt(option, VIEW_MAX);
  return `${toSvg(VIEW_MIN)},${toSvg(-firstY)} ${toSvg(VIEW_MAX)},${toSvg(-lastY)}`;
}

// 直線が描画範囲に収まっている x の区間を求める
function visibleXRange(option: GraphOption): [number, number] | null {
  let lo = VIEW_MIN;
  let hi = VIEW_MAX;
  if (option.slope !== 0) {
    const xa = (VIEW_MIN - option.intercept) / option.slope;
    const xb = (VIEW_MAX - option.intercept) / option.slope;
    lo = Math.max(lo, Math.min(xa, xb));
    hi = Math.min(hi, Math.max(xa, xb));
  } else if (option.intercept < VIEW_MIN || option.intercept > VIEW_MAX) {
    return null;
  }
  if (hi - lo < 0.5) return null;
  return [lo, hi];
}

type SlopeMarker = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

// 直線の中央付近に 2 点のマーカーを置く。軸との交点はあえて避ける。
function getSlopeMarker(option: GraphOption): SlopeMarker | null {
  const range = visibleXRange(option);
  if (!range) return null;
  const [lo, hi] = range;
  const run = Number.isInteger(option.slope) ? 1 : 2;
  const center = (lo + hi) / 2;
  const minX0 = Math.ceil(lo + 0.001);
  const maxX0 = Math.floor(hi - run - 0.001);

  if (maxX0 >= minX0) {
    const preferred = Math.min(Math.max(Math.round(center - run / 2), minX0), maxX0);
    const candidates: number[] = [];
    for (let delta = 0; delta <= maxX0 - minX0; delta += 1) {
      candidates.push(preferred + delta, preferred - delta);
    }
    const inRange = candidates.filter((x) => x >= minX0 && x <= maxX0);
    const clear = inRange.find((x0) => {
      const x1 = x0 + run;
      return x0 !== 0 && x1 !== 0 && yAt(option, x0) !== 0 && yAt(option, x1) !== 0;
    });
    const x0 = clear ?? inRange[0] ?? preferred;
    return { x0, x1: x0 + run, y0: yAt(option, x0), y1: yAt(option, x0 + run) };
  }

  // 整数の端点が収まらない急な直線は、可視区間の中央に等幅で置く
  const half = Math.min(run, hi - lo) / 2;
  const x0 = center - half;
  const x1 = center + half;
  return { x0, x1, y0: yAt(option, x0), y1: yAt(option, x1) };
}

function LinearGraph({ option, size = 'small' }: LinearGraphProps) {
  const axis = toSvg(0);
  const graphSize = size === 'large' ? 'large' : 'small';
  const label = `傾き${option.slope}、切片${option.intercept}の直線`;
  const marker = getSlopeMarker(option);

  return (
    <svg className={`linear-graph ${graphSize}`} viewBox="0 0 200 200" role="img" aria-label={label}>
      <rect x="0" y="0" width="200" height="200" fill="#fffdf8" />
      {[-4, -3, -2, -1, 1, 2, 3, 4].map((value) => (
        <g key={value}>
          <line x1={toSvg(value)} y1={PADDING} x2={toSvg(value)} y2={PADDING + PLOT_SIZE} className="graph-grid" />
          <line x1={PADDING} y1={toSvg(-value)} x2={PADDING + PLOT_SIZE} y2={toSvg(-value)} className="graph-grid" />
        </g>
      ))}
      <line x1={PADDING} y1={axis} x2={PADDING + PLOT_SIZE} y2={axis} className="graph-axis" />
      <line x1={axis} y1={PADDING} x2={axis} y2={PADDING + PLOT_SIZE} className="graph-axis" />
      <polyline points={getLinePoints(option)} className="graph-line" />
      {marker && (
        <g>
          <circle cx={toSvg(marker.x0)} cy={toSvg(-marker.y0)} r={3} className="graph-intersection-point" />
          <circle cx={toSvg(marker.x1)} cy={toSvg(-marker.y1)} r={3} className="graph-intersection-point" />
        </g>
      )}
      <text x="181" y={axis - 5} className="graph-label">x</text>
      <text x={axis + 5} y="18" className="graph-label">y</text>
    </svg>
  );
}

export default LinearGraph;
