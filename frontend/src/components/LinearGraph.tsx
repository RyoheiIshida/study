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

function getLinePoints(option: GraphOption) {
  const firstY = option.slope * VIEW_MIN + option.intercept;
  const lastY = option.slope * VIEW_MAX + option.intercept;
  return `${toSvg(VIEW_MIN)},${toSvg(-firstY)} ${toSvg(VIEW_MAX)},${toSvg(-lastY)}`;
}

function getXIntercept(option: GraphOption): number | null {
  if (option.slope === 0) return null;
  return -option.intercept / option.slope;
}

function LinearGraph({ option, size = 'small' }: LinearGraphProps) {
  const axis = toSvg(0);
  const graphSize = size === 'large' ? 'large' : 'small';
  const label = `傾き${option.slope}、切片${option.intercept}の直線`;
  const xIntercept = getXIntercept(option);
  const showYPoint = option.intercept >= VIEW_MIN && option.intercept <= VIEW_MAX;
  const showXPoint = xIntercept !== null && xIntercept >= VIEW_MIN && xIntercept <= VIEW_MAX;
  const sameAtOrigin = showXPoint && showYPoint && xIntercept === 0 && option.intercept === 0;

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
      {showYPoint && (
        <circle cx={axis} cy={toSvg(-option.intercept)} r={3} className="graph-intersection-point" />
      )}
      {showXPoint && !sameAtOrigin && (
        <circle cx={toSvg(xIntercept as number)} cy={axis} r={3} className="graph-intersection-point" />
      )}
      <text x="181" y={axis - 5} className="graph-label">x</text>
      <text x={axis + 5} y="18" className="graph-label">y</text>
    </svg>
  );
}

export default LinearGraph;
