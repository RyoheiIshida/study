import { Song } from '../types';
import { sunriseSteps } from './sunriseSteps';
import { numberMarch } from './numberMarch';
import { kanjiNight } from './kanjiNight';
import { slopeLine } from './slopeLine';
import { neonRush } from './neonRush';

export const songs: Song[] = [sunriseSteps, numberMarch, kanjiNight, slopeLine, neonRush];

export const songById = new Map(songs.map((song) => [song.id, song]));

export { sunriseSteps, numberMarch, kanjiNight, slopeLine, neonRush };
