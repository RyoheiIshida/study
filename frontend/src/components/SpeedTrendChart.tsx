import { useMemo, useState } from 'react';
import { AnswerSpeedTrendPoint } from '../types';
import { getDifficultyOrder } from '../utils/quizGroups';

const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];

interface SpeedTrendChartProps {
  points: AnswerSpeedTrendPoint[];
}

interface SeriesDatum {
  label: string;
  color: string;
  valuesByDate: Map<string, { averageSeconds: number; count: number }>;
}

const WIDTH = 760;
const HEIGHT = 280;
const PADDING_LEFT = 46;
const PADDING_RIGHT = 20;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 34;
const PLOT_WIDTH = WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

function formatDateLabel(date: string) {
  return date.slice(5).replace('-', '/');
}

function SpeedTrendChart({ points }: SpeedTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const dates = useMemo(() => Array.from(new Set(points.map((point) => point.date))).sort(), [points]);

  const series = useMemo<SeriesDatum[]>(() => {
    const difficulties = Array.from(new Set(points.map((point) => point.difficulty))).sort(
      (a, b) => getDifficultyOrder(a) - getDifficultyOrder(b),
    );
    return difficulties.map((label, index) => {
      const valuesByDate = new Map<string, { averageSeconds: number; count: number }>();
      points
        .filter((point) => point.difficulty === label)
        .forEach((point) => valuesByDate.set(point.date, { averageSeconds: point.averageSeconds, count: point.count }));
      return { label, color: SERIES_COLORS[index % SERIES_COLORS.length], valuesByDate };
    });
  }, [points]);

  const maxSeconds = Math.max(1, ...points.map((point) => point.averageSeconds));
  const yMax = Math.max(5, Math.ceil(maxSeconds / 5) * 5);

  function xFor(index: number) {
    if (dates.length <= 1) return PADDING_LEFT + PLOT_WIDTH / 2;
    return PADDING_LEFT + (index / (dates.length - 1)) * PLOT_WIDTH;
  }

  function yFor(value: number) {
    return PADDING_TOP + PLOT_HEIGHT - (value / yMax) * PLOT_HEIGHT;
  }

  function buildPath(datum: SeriesDatum) {
    let path = '';
    let drawing = false;
    dates.forEach((date, index) => {
      const value = datum.valuesByDate.get(date);
      if (!value) return;
      const command = drawing ? 'L' : 'M';
      path += `${command}${xFor(index)},${yFor(value.averageSeconds)} `;
      drawing = true;
    });
    return path.trim();
  }

  function lastPoint(datum: SeriesDatum) {
    for (let index = dates.length - 1; index >= 0; index -= 1) {
      const value = datum.valuesByDate.get(dates[index]);
      if (value) {
        return { x: xFor(index), y: yFor(value.averageSeconds), averageSeconds: value.averageSeconds };
      }
    }
    return null;
  }

  const yTicks = [0, yMax / 2, yMax];
  const xLabelStep = Math.max(1, Math.ceil(dates.length / 8));
  const hoverDate = hoverIndex !== null ? dates[hoverIndex] : null;

  const summary = series
    .map((datum) => {
      const values = Array.from(datum.valuesByDate.values());
      const avg = values.reduce((sum, value) => sum + value.averageSeconds, 0) / values.length;
      return `${datum.label}: 平均${avg.toFixed(1)}秒`;
    })
    .join('、');

  return (
    <div className="speed-chart">
      <svg
        className="speed-chart-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`難易度ごとの解答スピードの推移。${summary}`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING_LEFT}
              y1={yFor(tick)}
              x2={WIDTH - PADDING_RIGHT}
              y2={yFor(tick)}
              className="speed-chart-grid"
            />
            <text x={PADDING_LEFT - 10} y={yFor(tick) + 4} className="speed-chart-axis-label" textAnchor="end">
              {tick}秒
            </text>
          </g>
        ))}

        {dates.map((date, index) =>
          index % xLabelStep === 0 ? (
            <text
              key={date}
              x={xFor(index)}
              y={HEIGHT - PADDING_BOTTOM + 20}
              className="speed-chart-axis-label"
              textAnchor="middle"
            >
              {formatDateLabel(date)}
            </text>
          ) : null,
        )}

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            y1={PADDING_TOP}
            x2={xFor(hoverIndex)}
            y2={HEIGHT - PADDING_BOTTOM}
            className="speed-chart-crosshair"
          />
        )}

        {series.map((datum) => (
          <path key={datum.label} d={buildPath(datum)} fill="none" stroke={datum.color} className="speed-chart-line" />
        ))}

        {series.map((datum) =>
          dates.map((date, index) => {
            const value = datum.valuesByDate.get(date);
            if (!value) return null;
            return (
              <circle
                key={`${datum.label}-${date}`}
                cx={xFor(index)}
                cy={yFor(value.averageSeconds)}
                r={4}
                fill={datum.color}
                className="speed-chart-dot"
              />
            );
          }),
        )}

        {series.map((datum) => {
          const point = lastPoint(datum);
          if (!point) return null;
          return (
            <text
              key={`${datum.label}-end-label`}
              x={point.x + 6}
              y={point.y + 4}
              className="speed-chart-end-label"
            >
              {point.averageSeconds.toFixed(1)}秒
            </text>
          );
        })}

        {dates.map((date, index) => (
          <rect
            key={date}
            x={PADDING_LEFT + (index / dates.length) * PLOT_WIDTH}
            y={PADDING_TOP}
            width={PLOT_WIDTH / dates.length}
            height={PLOT_HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(index)}
          />
        ))}
      </svg>

      {hoverDate && (
        <div
          className="speed-chart-tooltip"
          style={{ left: `${(xFor(hoverIndex ?? 0) / WIDTH) * 100}%` }}
        >
          <strong>{hoverDate}</strong>
          <ul>
            {series.map((datum) => {
              const value = datum.valuesByDate.get(hoverDate);
              return (
                <li key={datum.label}>
                  <span className="speed-chart-tooltip-key" style={{ background: datum.color }} />
                  {datum.label}: {value ? `${value.averageSeconds.toFixed(1)}秒（${value.count}問）` : '記録なし'}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="speed-chart-legend">
        {series.map((datum) => (
          <span className="speed-chart-legend-item" key={datum.label}>
            <span className="speed-chart-legend-swatch" style={{ background: datum.color }} />
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default SpeedTrendChart;
