import { useDailyQuests } from '../hooks/useDailyQuests';

function DailyQuestPanel() {
  const { quests, isLoading } = useDailyQuests();

  return (
    <div className="panel">
      <p className="eyebrow">デイリークエスト</p>
      <h2>今日の目標</h2>
      {isLoading ? (
        <p>クエストを読み込み中...</p>
      ) : quests.length === 0 ? (
        <p>クエストの読み込みに失敗しました。しばらくしてから再度お試しください。</p>
      ) : (
        <div className="quest-grid">
          {quests.map((quest) => (
            <article key={quest.id} className={`card quest-card ${quest.completed ? 'quest-complete' : ''}`}>
              <div className="quest-card-header">
                <h3>{quest.title}</h3>
                {quest.completed && <span className="tag">達成</span>}
              </div>
              <p>{quest.description}</p>
              <div className="meter" aria-label={`${quest.current}/${quest.target}`}>
                <span style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }} />
              </div>
              <p className="hint">{quest.current} / {quest.target}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default DailyQuestPanel;
