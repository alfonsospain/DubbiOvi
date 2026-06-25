import type { ProjectSettings, Take, GlossaryEntry } from './types';

export interface WorkspaceState {
  settings: ProjectSettings;
  takes: Take[];
  glossary: GlossaryEntry[];
  videoFileName?: string | null;
  activeFilePath?: string | null;
}

const AUTOSAVE_KEY = 'dubbiovi_autosave';

export function loadAutosave(): WorkspaceState | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as WorkspaceState;
  } catch (error) {
    console.error('Failed to load autosave from localStorage:', error);
    return null;
  }
}

export function saveAutosave(workspaceState: WorkspaceState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(workspaceState));
  } catch (error) {
    console.error('Failed to save autosave to localStorage:', error);
  }
}

export function clearAutosave(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (error) {
    console.error('Failed to clear autosave from localStorage:', error);
  }
}
