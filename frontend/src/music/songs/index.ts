import { Song } from '../types';
import { blueHour } from './blueHour';
import { neonRush } from './neonRush';

/**
 * 選べる曲。
 *
 * 初期の4曲（サンライズステップス／ナンバーマーチ／漢字ナイト／スロープライン）は非表示にして、
 * ネオンラッシュとブルーアワーの2曲にしている。ファイルは残してあるので、戻したくなったら
 * import して下の配列に足すだけでよい。
 */
export const songs: Song[] = [neonRush, blueHour];

export const songById = new Map(songs.map((song) => [song.id, song]));

export { neonRush, blueHour };
