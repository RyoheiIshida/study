import { RewardRule } from '../types';

const MAX_STARS = 3;

interface RewardBadgeProps {
  reward: RewardRule;
}

/** 難易度（星）と、1問正解ごとにもらえる XP・ポイント。難しいほど多くもらえることを選ぶ前に見せる。 */
function RewardBadge({ reward }: RewardBadgeProps) {
  const stars = '★'.repeat(reward.stars) + '☆'.repeat(MAX_STARS - reward.stars);
  const points = reward.pointsPerCorrect > 0 ? `${reward.pointsPerCorrect}pt` : 'ポイントなし';

  return (
    <span className={`reward-badge reward-${reward.tier}`}>
      <span aria-label={`難易度 ${reward.label}`}>{reward.stars > 0 ? stars : reward.label}</span>
      <span>1問 {reward.xpPerCorrect}XP・{points}</span>
    </span>
  );
}

export default RewardBadge;
