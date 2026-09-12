/**
 * 曲データの構造チェック。
 *
 *   node .claude/skills/add-song/verify-song.mjs frontend/src/music/songs/neonRush.ts
 *
 * 音を聴かずに分かる範囲（拍の収まり・音域・ドラムの文字数・コード名・難易度ごとの秒数）を
 * まとめて出す。ビルドを通す前の一次チェックとして使う。
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(repoRoot, 'package.json'));

/** engine.ts / chart.ts / synth.ts の定数。あちらを変えたらこちらも合わせる。 */
const DRUM_STEPS_PER_BAR = 16;
const BEATS_PER_QUESTION = { easy: 8, normal: 6, hard: 4 };
const TIER_LABEL = { easy: 'やさしい', normal: 'ふつう', hard: 'むずかしい' };
/** playTone の既定 release（秒）。曲データからは指定できない。 */
const RELEASE_S = 0.09;
/** synth.ts の ROOT_SEMITONES / CHORD_INTERVALS が受け付ける形。ここを外すと黙って C になる。 */
const CHORD_RE = /^[A-G][#b]?(|m|7|m7|maj7|sus4)$/;

const target = process.argv[2];
if (!target) {
  console.error('使い方: node verify-song.mjs <曲ファイルのパス>');
  process.exit(2);
}
const entry = path.resolve(process.cwd(), target);
if (!fs.existsSync(entry)) {
  console.error(`ファイルが無い: ${entry}`);
  process.exit(2);
}

const esbuild = require('esbuild');
const outfile = path.join(os.tmpdir(), `verify-song-${process.pid}.cjs`);
await esbuild.build({ entryPoints: [entry], bundle: true, format: 'cjs', outfile, logLevel: 'silent' });

const module_ = require(outfile);
const song = Object.values(module_).find((v) => v && typeof v === 'object' && 'bpm' in v && 'lead' in v);
fs.rmSync(outfile, { force: true });
if (!song) {
  console.error('Song らしきエクスポートが見つからない。export const xxx: Song = {...} になっているか確認する。');
  process.exit(2);
}

const errors = [];
const warnings = [];
const loopBeats = song.loopBars * song.beatsPerBar;
const secondsPerBeat = 60 / song.bpm;

for (const [part, notes] of [['lead', song.lead], ['bass', song.bass]]) {
  for (const n of notes) {
    if (!(n.beat >= 0 && n.beat < loopBeats)) errors.push(`${part}: beat ${n.beat} がループ(0〜${loopBeats})の外`);
    if (!Number.isFinite(n.midi) || n.midi < 20 || n.midi > 108) errors.push(`${part}: midi ${n.midi} が異常`);
    if (!(n.dur > 0)) errors.push(`${part}: beat ${n.beat} の dur が ${n.dur}`);
  }
}

if (song.chords.length !== song.loopBars) {
  errors.push(`chords が ${song.chords.length}個。loopBars(${song.loopBars})と一致させる`);
}
for (const name of song.chords) {
  if (!CHORD_RE.test(name)) errors.push(`コード名 '${name}' は解釈できない（黙って C メジャーになる）`);
}

for (const [kit, patterns] of Object.entries(song.drums)) {
  patterns.forEach((p, i) => {
    if (p.length !== DRUM_STEPS_PER_BAR) errors.push(`drums.${kit}[${i}] が ${p.length}文字（${DRUM_STEPS_PER_BAR}文字ちょうどにする）`);
  });
  if (patterns.length !== 1 && patterns.length !== song.loopBars) {
    warnings.push(`drums.${kit} が ${patterns.length}小節ぶん。先頭から繰り返されるので意図どおりなら問題ない。最終小節だけフィルを入れたいなら ${song.loopBars}要素書く`);
  }
}

if (!song.comboScale?.length) errors.push('comboScale が空');
else if (song.comboScale.some((m, i, a) => i > 0 && m <= a[i - 1])) errors.push('comboScale が昇順でない');

const shortNotes = song.lead.filter((n) => n.dur * secondsPerBeat < RELEASE_S).length;
if (shortNotes > song.lead.length * 0.4) {
  warnings.push(`lead の ${shortNotes}/${song.lead.length} 音が release(${RELEASE_S}秒)より短い。16分の連発は音が濁る`);
}

const scale = song.beatsPerQuestionScale ?? 1;
const rows = Object.entries(BEATS_PER_QUESTION).map(([tier, base]) => {
  const exact = base * scale;
  if (!Number.isInteger(exact)) {
    errors.push(`${TIER_LABEL[tier]}: ${base} × ${scale} = ${exact} 拍。整数にならず判定ノーツが裏拍にずれる（scale は0.5刻みにする）`);
  }
  const beats = Math.round(exact);
  return { tier, beats, sec: beats * secondsPerBeat };
});

console.log(`\n♪ ${song.title} (${song.id}) — BPM ${song.bpm} / ${song.loopBars}小節ループ = ${(loopBeats * secondsPerBeat).toFixed(2)}秒`);
console.log(`  lead ${song.lead.length}音 midi ${Math.min(...song.lead.map((n) => n.midi))}〜${Math.max(...song.lead.map((n) => n.midi))}`);
console.log(`  bass ${song.bass.length}音 midi ${Math.min(...song.bass.map((n) => n.midi))}〜${Math.max(...song.bass.map((n) => n.midi))}`);
console.log(`  進行 ${song.chords.join(' - ')}`);
console.log(`  beatsPerQuestionScale ${scale}`);
for (const r of rows) console.log(`    ${TIER_LABEL[r.tier].padEnd(6)} ${String(r.beats).padStart(2)}拍/問 = ${r.sec.toFixed(2)}秒  (目安 ${{ easy: 4.3, normal: 3.2, hard: 2.1 }[r.tier]}秒)`);

if (warnings.length) console.log('\n注意:\n' + warnings.map((w) => '  - ' + w).join('\n'));
if (errors.length) {
  console.log('\nNG:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('\nOK — 構造チェック通過（音そのものは聴いて確認すること）\n');
