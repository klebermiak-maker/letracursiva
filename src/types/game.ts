export type LetterCase = 'lowercase' | 'uppercase';

export interface Point {
  x: number;
  y: number;
}

export interface StrokeWaypoint {
  x: number;
  y: number;
  label?: string; // e.g. "1", "2"
}

export interface StrokeSegment {
  points: Point[]; // normalized 0..100 coordinates
  directionArrow?: {
    from: Point;
    to: Point;
  };
}

export interface LetterData {
  char: string;
  displayChar: string;
  name: string;
  exampleWord: string;
  exampleIcon: string;
  caseType: LetterCase;
  category: 'vogal' | 'consoante';
  strokes: StrokeSegment[];
  waypoints: StrokeWaypoint[]; // normalized path checkpoints
  instruction: string;
  difficulty: 1 | 2 | 3;
}

export interface WordData {
  id: string;
  word: string;
  syllables: string[];
  meaning: string;
  icon: string;
  strokes: StrokeSegment[];
  waypoints: StrokeWaypoint[];
}

export interface StickerReward {
  id: string;
  letter: string;
  title: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface DailyProgress {
  dia: string;
  nomeCompleto: string;
  dataIso: string;
  letrasCompletadas: number;
  precisaoMedia: number;
  tentativas: number;
  estrelas: number;
}

export interface UserProgress {
  studentName: string;
  completedLetters: Record<string, { stars: number; attempts: number; bestScore: number }>;
  completedWords: Record<string, { stars: number }>;
  stickersUnlocked: string[];
  totalStars: number;
  handPreference: 'right' | 'left';
  soundEnabled: boolean;
  voiceEnabled: boolean;
  weeklyProgress?: DailyProgress[];
}
