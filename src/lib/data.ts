import type { ProjectSettings, Take, Language } from './types';

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  title: 'Courtroom Drama - The Verdict',
  sourceLang: 'EN',
  targetLang: 'ES',
  translator: 'Your Name',
};

export const DEFAULT_TAKES: Take[] = [
  {
    id: 1,
    character: 'Judge',
    time: '00:02.000 - 00:06.500',
    startSeconds: 2.0,
    endSeconds: 6.5,
    original:
      'Members of the jury, you must now retire to consider your verdict.',
    translation: '',
    notes: '',
    status: 'In Progress',
  },
  {
    id: 2,
    character: 'Defense Lawyer',
    time: '00:07.000 - 00:12.000',
    startSeconds: 7.0,
    endSeconds: 12.0,
    original:
      'Remember that doubt, any reasonable doubt, must always benefit the defendant.',
    translation: '',
    notes: '',
    status: 'In Progress',
  },
  {
    id: 3,
    character: 'Prosecutor',
    time: '00:12.500 - 00:18.000',
    startSeconds: 12.5,
    endSeconds: 18.0,
    original: 'The evidence you have heard is clear, consistent and overwhelming.',
    translation: '',
    notes: '',
    status: 'In Progress',
  },
  {
    id: 4,
    character: 'Judge',
    time: '00:19.000 - 00:22.000',
    startSeconds: 19.0,
    endSeconds: 22.0,
    original: 'The court is adjourned until the jury reaches a decision.',
    translation: '',
    notes: '',
    status: 'In Progress',
  },
];

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'EN', name: 'English' },
    { code: 'ES', name: 'Spanish' },
    { code: 'FR', name: 'French' },
    { code: 'DE', name: 'German' },
    { code: 'IT', name: 'Italian' },
    { code: 'PT', name: 'Portuguese' },
    { code: 'JA', name: 'Japanese' },
    { code: 'ZH', name: 'Chinese' },
    { code: 'RU', name: 'Russian' },
    { code: 'AR', name: 'Arabic' },
];
