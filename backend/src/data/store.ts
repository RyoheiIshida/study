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
    title: 'たし算スプリント',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: '1桁のたし算でウォームアップしましょう。',
    questions: [
      { id: 'q1', text: '3 + 5 = ?', answer: '8', explanation: '3と5をたすと8になります。' },
      { id: 'q2', text: '7 + 2 = ?', answer: '9', explanation: '7から2つ数えると8、9です。' },
      { id: 'q3', text: '6 + 4 = ?', answer: '10', explanation: '6と4を合わせると10になる組み合わせです。' },
    ],
  },
  {
    id: 'small-math-2',
    title: 'ひき算レンジャー',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: '小さな数のひき算に自信を持って取り組みましょう。',
    questions: [
      { id: 'q4', text: '10 - 3 = ?', answer: '7', explanation: '10から3を引くと7になります。' },
      { id: 'q5', text: '14 - 5 = ?', answer: '9', explanation: '14から5を引くと9です。' },
      { id: 'q6', text: '8 - 2 = ?', answer: '6', explanation: '8より2小さい数は6です。' },
    ],
  },
  {
    id: 'small-math-3',
    title: 'かけ算マスター',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: '小さな数のかけ算でリズムをつかみましょう。',
    questions: [
      { id: 'q7', text: '3 x 4 = ?', answer: '12', explanation: '4のかたまりが3つで12になります。' },
      { id: 'q8', text: '6 x 2 = ?', answer: '12', explanation: '6を2倍すると12です。' },
      { id: 'q9', text: '7 x 3 = ?', answer: '21', explanation: '7 + 7 + 7 = 21です。' },
    ],
  },
  {
    id: 'small-math-4',
    title: 'わり算トレイル',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: '数を同じ数ずつのグループに分けましょう。',
    questions: [
      { id: 'q10', text: '12 / 3 = ?', answer: '4', explanation: '12を3等分すると1つあたり4になります。' },
      { id: 'q11', text: '15 / 5 = ?', answer: '3', explanation: '15を5等分すると1つあたり3になります。' },
      { id: 'q12', text: '18 / 6 = ?', answer: '3', explanation: '18を6等分すると1つあたり3になります。' },
    ],
  },
  {
    id: 'kanji-reading-1',
    title: '漢字の読み ドリル（小学生）',
    subject: 'Japanese',
    grade: 'Elementary',
    description: '小学校で習う漢字の読み方をひらがなで答えましょう。',
    questions: [
      { id: 'kj1', text: '「食べる」の読み方は？', answer: 'たべる', explanation: '「食」は「た(べる)」「しょく」と読みます。' },
      { id: 'kj2', text: '「大きい」の読み方は？', answer: 'おおきい', explanation: '「大」は「おお(きい)」「だい」と読みます。' },
      { id: 'kj3', text: '「学校」の読み方は？', answer: 'がっこう', explanation: '「学」は「がく」、「校」は「こう」と読みます。' },
      { id: 'kj4', text: '「先生」の読み方は？', answer: 'せんせい', explanation: '「先」は「せん」、「生」は「せい」と読みます。' },
      { id: 'kj5', text: '「友達」の読み方は？', answer: 'ともだち', explanation: '「友」は「とも」、「達」は「だち」と読みます。' },
      { id: 'kj6', text: '「家族」の読み方は？', answer: 'かぞく', explanation: '「家」は「か」、「族」は「ぞく」と読みます。' },
      { id: 'kj7', text: '「水泳」の読み方は？', answer: 'すいえい', explanation: '「水」は「すい」、「泳」は「えい」と読みます。' },
      { id: 'kj8', text: '「図書館」の読み方は？', answer: 'としょかん', explanation: '「図書」で「としょ」、「館」は「かん」と読みます。' },
      { id: 'kj9', text: '「明日」の読み方は？', answer: 'あした', explanation: '「明日」は特別な読み方をする熟字訓です。' },
      { id: 'kj10', text: '「今日」の読み方は？', answer: 'きょう', explanation: '「今日」も特別な読み方をする熟字訓です。' },
      { id: 'kj11', text: '「天気」の読み方は？', answer: 'てんき', explanation: '「天」は「てん」、「気」は「き」と読みます。' },
      { id: 'kj12', text: '「音楽」の読み方は？', answer: 'おんがく', explanation: '「音」は「おん」、「楽」は「がく」と読みます。' },
      { id: 'kj13', text: '「動物」の読み方は？', answer: 'どうぶつ', explanation: '「動」は「どう」、「物」は「ぶつ」と読みます。' },
      { id: 'kj14', text: '「病院」の読み方は？', answer: 'びょういん', explanation: '「病」は「びょう」、「院」は「いん」と読みます。' },
      { id: 'kj15', text: '「世界」の読み方は？', answer: 'せかい', explanation: '「世」は「せ」、「界」は「かい」と読みます。' },
    ],
  },
];

export function getQuizzes(): Quiz[] {
  return defaultQuizzes;
}
