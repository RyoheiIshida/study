import { useCallback, useEffect, useState } from 'react';
import { fetchProgress, fetchQuizzes, filterQuizzes, saveProgress } from '../api/quiz';
import { Grade, ProgressRecord, Quiz, Subject } from '../types';

export function useQuizStore() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allQuizzes, allProgress] = await Promise.all([fetchQuizzes(), fetchProgress()]);
      setQuizzes(allQuizzes);
      setProgress(allProgress);
      setIsLoading(false);
    }
    load();
  }, []);

  const refreshQuizzes = useCallback(async (subject?: Subject, grade?: Grade) => {
    setIsLoading(true);
    const filtered = await filterQuizzes(subject, grade);
    setQuizzes(filtered);
    setIsLoading(false);
  }, []);

  const updateProgress = useCallback(async (record: ProgressRecord) => {
    await saveProgress(record);
    setProgress((items) => {
      const next = [...items];
      const index = next.findIndex((item) => item.quizId === record.quizId);
      if (index >= 0) {
        next[index] = record;
      } else {
        next.push(record);
      }
      return next;
    });
  }, []);

  return {
    quizzes,
    progress,
    isLoading,
    refreshQuizzes,
    updateProgress,
  };
}
