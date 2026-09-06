import { useCallback, useEffect, useState } from 'react';
import { fetchProgress, filterQuizzes, saveProgress } from '../api/quiz';
import { Grade, ProgressRecord, Quiz, Subject } from '../types';

export function useQuizStore(subject?: Subject, grade?: Grade) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    filterQuizzes(subject, grade).then((filtered) => {
      if (cancelled) return;
      setQuizzes(filtered);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [subject, grade]);

  useEffect(() => {
    let cancelled = false;
    fetchProgress().then((allProgress) => {
      if (cancelled) return;
      setProgress(allProgress);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshQuizzes = useCallback(async (nextSubject?: Subject, nextGrade?: Grade) => {
    setIsLoading(true);
    const filtered = await filterQuizzes(nextSubject ?? subject, nextGrade ?? grade);
    setQuizzes(filtered);
    setIsLoading(false);
  }, [subject, grade]);

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
