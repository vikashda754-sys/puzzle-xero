export type GameMode = 'CIRCUIT' | 'DECODE';

export type DifficultySize = 4 | 5 | 6 | 7;

export interface DifficultyConfig {
  size: DifficultySize;
  label: string;
  tier: string;
}

export interface Coord {
  r: number;
  c: number;
}

export interface TileState {
  baseMask: number;
  initialRot: number;
  rot: number;
  visualRot: number;
  pinned: boolean;
}

export interface MoveRecord {
  r: number;
  c: number;
  delta: number;
}

export interface PowerAnalysis {
  powered: boolean[][];
  poweredCount: number;
  leakCount: number;
  leakingTiles: boolean[][];
  isComplete: boolean;
}

export type GameStatus = 'PLAYING' | 'WON';

export interface BestRecord {
  moves: number;
  seconds: number;
}

export interface SignalToken {
  id: string;
  name: string;
  keyHint: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string;
}

export interface DecodeDifficultyConfig {
  size: DifficultySize;
  codeLength: number;
  tokenCount: number;
  maxAttempts: number;
  label: string;
}

export interface DecodeFeedback {
  exact: number;
  present: number;
}

export interface DecodeAttempt {
  guess: string[];
  feedback: DecodeFeedback;
}

export type DecodeStatus = 'PLAYING' | 'WON' | 'LOST';

export interface DecodeBestRecord {
  attempts: number;
  seconds: number;
}
