export type Question = {
  id: string;
  text: string;
  answer: string;
  explanation?: string;
};

export type Quiz = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  questions: Question[];
};

export const defaultQuizzes: Quiz[] = [
  {
    id: 'small-math-1',
    title: 'Addition Sprint',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: 'Warm up with quick one-digit addition.',
    questions: [
      { id: 'q1', text: '3 + 5 = ?', answer: '8', explanation: '3 plus 5 makes 8.' },
      { id: 'q2', text: '7 + 2 = ?', answer: '9', explanation: 'Count two steps after 7: 8, 9.' },
      { id: 'q3', text: '6 + 4 = ?', answer: '10', explanation: '6 and 4 are a pair that makes 10.' },
    ],
  },
  {
    id: 'small-math-2',
    title: 'Subtraction Ranger',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: 'Practice taking away small numbers with confidence.',
    questions: [
      { id: 'q4', text: '10 - 3 = ?', answer: '7', explanation: 'Take 3 away from 10 to get 7.' },
      { id: 'q5', text: '14 - 5 = ?', answer: '9', explanation: '14 minus 5 is 9.' },
      { id: 'q6', text: '8 - 2 = ?', answer: '6', explanation: 'Two less than 8 is 6.' },
    ],
  },
  {
    id: 'small-math-3',
    title: 'Multiplication Master',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: 'Build rhythm with small multiplication facts.',
    questions: [
      { id: 'q7', text: '3 x 4 = ?', answer: '12', explanation: '3 groups of 4 make 12.' },
      { id: 'q8', text: '6 x 2 = ?', answer: '12', explanation: 'Doubling 6 gives 12.' },
      { id: 'q9', text: '7 x 3 = ?', answer: '21', explanation: '7 + 7 + 7 = 21.' },
    ],
  },
  {
    id: 'small-math-4',
    title: 'Division Trail',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: 'Split numbers into equal groups.',
    questions: [
      { id: 'q10', text: '12 / 3 = ?', answer: '4', explanation: '12 split into 3 equal groups gives 4 in each.' },
      { id: 'q11', text: '15 / 5 = ?', answer: '3', explanation: '15 split into 5 equal groups gives 3 in each.' },
      { id: 'q12', text: '18 / 6 = ?', answer: '3', explanation: '18 split into 6 equal groups gives 3 in each.' },
    ],
  },
];

export function getQuizzes(): Quiz[] {
  return defaultQuizzes;
}
