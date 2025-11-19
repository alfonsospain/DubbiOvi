import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Take } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00,000';
  }
  const date = new Date(seconds * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const secs = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();

  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');
  const msStr = ms.toString().padStart(3, '0');

  return `${hStr}:${mStr}:${sStr},${msStr}`;
}

export function formatTimeForDisplay(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00.000';
  }
  const totalSeconds = Math.floor(seconds);
  const ms = Math.floor((seconds % 1) * 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0'
  )}.${String(ms).padStart(3, '0')}`;
}

export function parseTimeToSeconds(time: string): number {
    const parts = time.split(/[:,.]/);
    if (parts.length === 4) { // HH:MM:SS.ms
        const [hours, minutes, seconds, milliseconds] = parts.map(Number);
        return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    }
    if (parts.length === 3) { // MM:SS.ms
         const [minutes, seconds, milliseconds] = parts.map(Number);
         return minutes * 60 + seconds + milliseconds / 1000;
    }
    return 0;
}

export function toSRT(takes: Take[]): string {
  return takes
    .map((take, index) => {
      const startTime = formatTime(take.startSeconds).replace('.', ',');
      const endTime = formatTime(take.endSeconds).replace('.', ',');
      const text = take.translation || `[${take.character}: No translation]`;
      return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`;
    })
    .join('\n');
}

export function toVTT(takes: Take[]): string {
  let vtt = 'WEBVTT\n\n';
  vtt += takes
    .map(take => {
      const startTime = formatTime(take.startSeconds).replace(',', '.');
      const endTime = formatTime(take.endSeconds).replace(',', '.');
      const text = take.translation
        ? `<v ${take.character}>${take.translation}`
        : `[${take.character}: No translation]`;
      return `${startTime} --> ${endTime}\n${text}\n`;
    })
    .join('\n');
  return vtt;
}
