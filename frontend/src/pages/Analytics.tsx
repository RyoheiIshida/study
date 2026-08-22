import { useEffect, useMemo, useState } from 'react';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { fetchXpSummary } from '../api/xp';
import { ProgressRecord, Quiz, XpSummary } from '../types';
import {
  buildActivityCalendar,
  buildSubjectSummary,
  buildTrend,
  countRecentStudyDays,
  getAccuracy,
  getTotals,
} from '../utils/chartHelpers';
import { subjectLabel } from '../utils/labels';

function Analytics() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [xpSummary, setXpSummary] = useState<XpSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpError, setXpError] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [quizData, progressData] = await Promise.all([fetchQuizzes(), fetchProgress()]);
      setQuizzes(quizData);
      setRecords(progressData);

      try {
        setXpSummary(await fetchXpSummary());
        setXpError(false);
      } catch {
        setXpSummary(null);
        setXpError(true);
      }

      setLoading(false);
    }

    load();
  }, []);

  const trend = useMemo(() => buildTrend(records, quizzes), [records, quizzes]);
  const subjects = useMemo(() => buildSubjectSummary(records, quizzes), [records, quizzes]);
  const totals = getTotals(records);

  const xpTrend = xpSummary?.dailyXp ?? [];
  const maxCumulativeXp = xpTrend.reduce((max, point) => Math.max(max, point.cumulativeXp), 0);
  const levelUpDates = useMemo(
    () => new Set((xpSummary?.levelUps ?? []).map((event) => event.at.slice(0, 10))),
    [xpSummary],
  );
  const calendarWeeks = useMemo(() => buildActivityCalendar(xpTrend), [xpTrend]);
  const studyDaysLast30 = useMemo(() => countRecentStudyDays(xpTrend, 30), [xpTrend]);

  return (
    <section className="page-stack">
      <div className="panel">
        <p className="eyebrow">分析</p>
        <h2>学習の傾向</h2>
        <p>これまでに完了したクイズの正答率、連続正解数、科目バランスを表示します。</p>
        {xpError && <p className="feedback">経験値データを取得できませんでした。時間をおいて再度お試しください。</p>}
        <div className="stat-grid">
          <div className="stat-card">
            <span>総合正答率</span>
            <strong>{getAccuracy(totals.correct, totals.total)}%</strong>
          </div>
          <div className="stat-card">
            <span>回答した問題数</span>
            <strong>{totals.total}</strong>
          </div>
          <div className="stat-card">
            <span>最高連続正解数</span>
            <strong>{totals.bestStreak}</strong>
          </div>
          <div className="stat-card">
            <span>現在のレベル</span>
            <strong>{xpSummary ? `Lv.${xpSummary.level}` : '-'}</strong>
          </div>
          <div className="stat-card">
            <span>学習した日数</span>
            <strong>{xpSummary ? `${xpSummary.studyDays}日` : '-'}</strong>
          </div>
          <div className="stat-card">
            <span>直近30日の学習日数</span>
            <strong>{studyDaysLast30}日</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">学習カレンダー</p>
            <h2>何日にどれくらい取り組んだか</h2>
            <p>マスの濃さがその日に解いた問題数を表します。カーソルを合わせると詳細が見られます。</p>
          </div>
        </div>
        {loading ? (
          <p>学習履歴を読み込み中...</p>
        ) : xpTrend.length === 0 ? (
          <p>学習履歴はまだありません。クイズを完了すると記録が表示されます。</p>
        ) : (
          <>
            <div className="calendar-heatmap" role="img" aria-label="学習カレンダー">
              {calendarWeeks.map((week) => (
                <div className="calendar-week" key={week.days[0].date}>
                  <span className="calendar-month-label">{week.monthLabel ?? ''}</span>
                  <div className="calendar-week-days">
                    {week.days.map((day) => (
                      <span
                        key={day.date}
                        className={`calendar-day${day.isToday ? ' calendar-day-today' : ''}${
                          day.isFuture ? ' calendar-day-future' : ''
                        }`}
                        data-level={day.level}
                        title={`${day.date}：問題${day.questions}問 / ${day.xp}XP`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="calendar-legend">
              <span>少ない</span>
              <span className="calendar-day" data-level={0} />
              <span className="calendar-day" data-level={1} />
              <span className="calendar-day" data-level={2} />
              <span className="calendar-day" data-level={3} />
              <span className="calendar-day" data-level={4} />
              <span>多い</span>
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">経験値の推移</p>
            <h2>累計XPの伸び</h2>
            <p>クイズをこなすほどXPが積み上がり、レベルアップします。</p>
          </div>
        </div>
        {loading ? (
          <p>経験値を読み込み中...</p>
        ) : xpTrend.length === 0 ? (
          <p>経験値データはまだありません。クイズを完了するとXPが貯まります。</p>
        ) : (
          <div className="bar-chart" role="img" aria-label="累計経験値のグラフ">
            {xpTrend.map((point) => {
              const heightPercent = maxCumulativeXp > 0
                ? Math.round((point.cumulativeXp / maxCumulativeXp) * 100)
                : 0;
              const isLevelUpDay = levelUpDates.has(point.date);
              return (
                <div
                  className={`bar-column${isLevelUpDay ? ' bar-column-levelup' : ''}`}
                  key={point.date}
                >
                  <div className="bar-shell">
                    <span style={{ height: `${heightPercent}%` }} />
                  </div>
                  <strong>{point.cumulativeXp}XP</strong>
                  <small title={point.date}>{point.date.slice(5)}</small>
                </div>
              );
            })}
          </div>
        )}
        {xpSummary && xpSummary.levelUps.length > 0 && (
          <div className="level-history">
            {xpSummary.levelUps.map((event) => (
              <span className="tag" key={event.level}>
                Lv.{event.level} 到達 — {new Date(event.at).toLocaleDateString()}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">スコアの推移</p>
            <h2>直近のクイズ正答率</h2>
          </div>
        </div>
        {loading ? (
          <p>分析を読み込み中...</p>
        ) : trend.length === 0 ? (
          <p>分析データはまだありません。クイズを完了すると推移が表示されます。</p>
        ) : (
          <div className="bar-chart" role="img" aria-label="クイズ正答率のグラフ">
            {trend.map((point) => (
              <div className="bar-column" key={point.label}>
                <div className="bar-shell">
                  <span style={{ height: `${point.accuracy}%` }} />
                </div>
                <strong>{point.accuracy}%</strong>
                <small title={point.label}>{point.label}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">科目</p>
        <h2>科目別正答率</h2>
        <div className="subject-list">
          {subjects.length === 0 ? (
            <p>科目データはまだありません。</p>
          ) : subjects.map((subject) => (
            <article className="subject-row" key={subject.subject}>
              <div>
                <strong>{subjectLabel(subject.subject)}</strong>
                <span>{subject.correct} / {subject.total} 問正解</span>
              </div>
              <div className="meter" aria-label={`${subject.accuracy}%`}>
                <span style={{ width: `${subject.accuracy}%` }} />
              </div>
              <strong>{subject.accuracy}%</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Analytics;
