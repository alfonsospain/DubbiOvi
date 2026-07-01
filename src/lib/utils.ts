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

/**
 * Parses a timestamp in HH:MM:SS.mmm (or HH:MM:SS,mmm) format into absolute decimal seconds.
 * 
 * @param timestamp The timestamp string.
 * @returns The absolute time in decimal seconds.
 */
export function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp || typeof timestamp !== 'string') {
    throw new Error('Invalid timestamp input: must be a non-empty string');
  }

  // Normalize comma to dot for decimal milliseconds
  const normalized = timestamp.trim().replace(',', '.');

  // Regex to match HH:MM:SS.mmm format (HH can be 1 or more digits)
  const regex = /^(\d+):([0-5]\d):([0-5]\d)\.(\d+)$/;
  const match = normalized.match(regex);

  if (!match) {
    throw new Error(`Malformed timestamp: "${timestamp}". Expected format HH:MM:SS.mmm`);
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  
  // Convert milliseconds fractional part (e.g. "250" -> 0.250, "4" -> 0.004)
  const msStr = match[4];
  const milliseconds = parseInt(msStr, 10) / Math.pow(10, msStr.length);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(milliseconds)) {
    throw new Error(`Malformed timestamp: "${timestamp}". Numbers could not be parsed`);
  }

  return hours * 3600 + minutes * 60 + seconds + milliseconds;
}

