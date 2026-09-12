import { PLAY_MODES, PLAY_MODE_HINT, PLAY_MODE_LABEL, PlayMode } from '../utils/playMode';

interface Props {
  mode: PlayMode;
  onChange: (mode: PlayMode) => void;
}

/** 通常モードと音ゲーモードを切り替えるタブ。選んだモードで「開始」が始まる。 */
function PlayModeToggle({ mode, onChange }: Props) {
  return (
    <div className="play-mode">
      <p className="eyebrow">あそびかた</p>
      <div className="play-mode-tabs" role="tablist" aria-label="プレイモード">
        {PLAY_MODES.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={option === mode}
            className="play-mode-tab"
            onClick={() => onChange(option)}
          >
            {PLAY_MODE_LABEL[option]}
          </button>
        ))}
      </div>
      <p className="hint">{PLAY_MODE_HINT[mode]}</p>
    </div>
  );
}

export default PlayModeToggle;
