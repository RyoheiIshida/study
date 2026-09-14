export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 最初の段階で1回のプレイに出す問題数の上限。サーバーに届かず、その人の問題数（api/sessionLength.ts）が
 * 分からないときはこれを使う。backend/src/lib/sessionLength.ts の BASE_SESSION_QUESTIONS とそろえてある。
 */
export const MAX_SESSION_QUESTIONS = 15;

/**
 * 1回のプレイで出す問題を count 問えらぶ。
 *
 * 上達して問題数が伸び、クイズの問題数より多く出すときは、シャッフルした全問を何周もくり返す。
 * 周の変わり目で同じ問題が2回続かないように、次の周の先頭が前の問題と同じならずらす。
 */
export function pickSessionQuestions<T>(items: T[], count: number = MAX_SESSION_QUESTIONS): T[] {
  if (items.length === 0) return [];
  const result: T[] = [];
  while (result.length < count) {
    const round = shuffle(items);
    if (items.length > 1 && round[0] === result[result.length - 1]) {
      round.push(round.shift()!);
    }
    result.push(...round);
  }
  return result.slice(0, count);
}
