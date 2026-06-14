export interface ProjectSettings {
  projectName: string;
  title?: string;
  sourceLang: string;
  targetLang: string;
  translator: string;
}

export interface Take {
  id: string; // Use string for UUID
  character: string;
  time: string;
  startSeconds: number;
  endSeconds: number;
  original: string;
  translation: string;
  notes: string;
  status: 'Pending' | 'Reviewed' | 'Locked';
}

export interface Language {
  code: string;
  name: string;
}

export interface GlossaryEntry {
    id: string;
    sourceTerm: string;
    targetTerm: string;
    notes?: string;
}
