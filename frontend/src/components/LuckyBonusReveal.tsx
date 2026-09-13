import { LuckyBonus, LuckyTier } from '../types';

const TIER_DISPLAY: Record<LuckyTier, { icon: string; label: string }> = {
  lucky: { icon: '🍀', label: 'ラッキー！' },
  super: { icon: '⭐', label: 'スーパーラッキー！' },
  miracle: { icon: '🌈', label: 'ミラクル！！' },
};

interface LuckyBonusRevealProps {
  bonus: LuckyBonus | null;
}

/** リザルト画面で、クイズ終了時に引いたラッキーボーナスの結果を見せる。 */
function LuckyBonusReveal({ bonus }: LuckyBonusRevealProps) {
  // オフライン保存や、1問も正解していなくて抽選していないときは何も出さない。
  if (!bonus) return null;

  if (!bonus.tier) {
    return <p className="lucky-miss">🎲 ラッキーボーナス：今回ははずれ。正解が多いほど当たったときのXPが増えるよ</p>;
  }

  const display = TIER_DISPLAY[bonus.tier];
  return (
    <div className={`lucky-bonus lucky-${bonus.tier}`} role="status">
      <span className="lucky-bonus-icon" aria-hidden="true">{display.icon}</span>
      <div>
        <p className="eyebrow">ラッキーボーナス</p>
        <strong className="lucky-bonus-label">{display.label}</strong>
        <p className="lucky-bonus-detail">正解ぶんのXP ×{bonus.multiplier}（+{bonus.bonusXp}XP）</p>
      </div>
    </div>
  );
}

export default LuckyBonusReveal;
