import { useEffect, useState } from 'react';
import { fetchDailyQuests } from '../api/quests';
import { DailyQuest } from '../types';

export function useDailyQuests() {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await fetchDailyQuests();
      setQuests(result);
      setIsLoading(false);
    }
    load();
  }, []);

  return { quests, isLoading };
}
