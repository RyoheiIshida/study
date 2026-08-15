import { Grade, Subject } from '../types';

export const SUBJECT_LABELS: Record<Subject, string> = {
  Arithmetic: '算数',
  Math: '数学',
  English: '英語',
  Japanese: '国語',
};

export const GRADE_LABELS: Record<Grade, string> = {
  Elementary: '小学生',
  'Middle School': '中学生',
};

export function subjectLabel(subject: string): string {
  return SUBJECT_LABELS[subject as Subject] ?? subject;
}

export function gradeLabel(grade: string): string {
  return GRADE_LABELS[grade as Grade] ?? grade;
}
