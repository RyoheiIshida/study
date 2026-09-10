import { Song } from '../types';
import { sunriseSteps } from './sunriseSteps';
import { numberMarch } from './numberMarch';
import { kanjiNight } from './kanjiNight';

export const songs: Song[] = [sunriseSteps, numberMarch, kanjiNight];

export const songById = new Map(songs.map((song) => [song.id, song]));

export { sunriseSteps, numberMarch, kanjiNight };
