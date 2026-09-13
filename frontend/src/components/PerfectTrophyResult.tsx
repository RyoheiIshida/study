import { TrophySummary } from '../types';
import { RARITY_LABELS, rarityRank } from '../utils/rarity';
import RarityBadge from './RarityBadge';

interface PerfectTrophyResultProps {
  quizId: string;
  before: TrophySummary | null;
  after: TrophySummary | null;
}

/** 全問正解したときのリザルト表示。トロフィーの獲得や、レア度が上がったことを知らせる。 */
function PerfectTrophyResult({ quizId, before, after }: PerfectTrophyResultProps) {
  const previous = before?.trophies.find((trophy) => trophy.quizId === quizId);
  const current = after?.trophies.find((trophy) => trophy.quizId === quizId);

  // プレイ後のトロフィーが取れなかったときは、細かいことは言わずにお祝いだけする。
  if (!current) {
    return (
      <div className="trophy-result">
        <p className="feedback">🏆 全問正解トロフィー獲得！</p>
      </div>
    );
  }

  const nextText = current.next
    ? `あと${current.next.perfectDays - current.perfectDays}日で${RARITY_LABELS[current.next.rarity]}に上がるよ。`
    : 'これ以上ない最高のレア度です。';

  let headline: string;
  let detail: string;
  // プレイ前の状態が取れていないと「新しく」か判断できないので、そのときは獲得あつかいにしない。
  if (before && !previous) {
    headline = '🏆 新しいトロフィーを獲得しました！';
    detail = `ちがう日にまた全問正解すると、レア度が上がります。${nextText}`;
  } else if (previous && rarityRank(current.rarity) > rarityRank(previous.rarity)) {
    headline = `🌟 トロフィーが${RARITY_LABELS[current.rarity]}に進化しました！`;
    detail = nextText;
  } else if (previous && current.perfectDays === previous.perfectDays) {
    headline = '🏆 全問正解トロフィー獲得！';
    detail = current.next ? `今日のぶんはもう数えてあるよ。ちがう日にまた挑戦しよう。${nextText}` : nextText;
  } else {
    headline = `🏆 全問正解 ${current.perfectDays}日目！`;
    detail = nextText;
  }

  const upgraded = !previous || rarityRank(current.rarity) > rarityRank(previous.rarity);
  return (
    <div className={`trophy-result${upgraded && before ? ` rarity-reveal rarity-${current.rarity}` : ''}`} role="status">
      <p className="feedback">{headline}</p>
      <RarityBadge rarity={current.rarity} />
      <p className="hint">{detail}</p>
    </div>
  );
}

export default PerfectTrophyResult;
