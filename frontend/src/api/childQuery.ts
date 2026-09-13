/**
 * 親が連携済みの子供のデータを読むときに、読み取り系 API の末尾へ付けるクエリ。
 * child を渡さなければ空文字になり、ログイン中の本人のデータを読む。
 */
export function childQuery(child?: string): string {
  return child ? `?child=${encodeURIComponent(child)}` : '';
}
