import type { DecodeDifficultyConfig, DecodeFeedback, DifficultySize, SignalToken } from '../types/circuit';

export const SIGNAL_TOKENS: SignalToken[] = [
  {
    id: 'A',
    name: 'Alpha',
    keyHint: '1',
    bgClass: 'bg-sky-500/20',
    borderClass: 'border-sky-400/70',
    textClass: 'text-sky-200',
    dotColor: '#38bdf8',
  },
  {
    id: 'B',
    name: 'Beta',
    keyHint: '2',
    bgClass: 'bg-emerald-500/20',
    borderClass: 'border-emerald-400/70',
    textClass: 'text-emerald-200',
    dotColor: '#34d399',
  },
  {
    id: 'C',
    name: 'Gamma',
    keyHint: '3',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-400/70',
    textClass: 'text-amber-200',
    dotColor: '#fbbf24',
  },
  {
    id: 'D',
    name: 'Delta',
    keyHint: '4',
    bgClass: 'bg-rose-500/20',
    borderClass: 'border-rose-400/70',
    textClass: 'text-rose-200',
    dotColor: '#fb7185',
  },
  {
    id: 'E',
    name: 'Echo',
    keyHint: '5',
    bgClass: 'bg-violet-500/20',
    borderClass: 'border-violet-400/70',
    textClass: 'text-violet-200',
    dotColor: '#a78bfa',
  },
  {
    id: 'F',
    name: 'Flux',
    keyHint: '6',
    bgClass: 'bg-cyan-500/20',
    borderClass: 'border-cyan-400/70',
    textClass: 'text-cyan-200',
    dotColor: '#22d3ee',
  },
  {
    id: 'G',
    name: 'Grid',
    keyHint: '7',
    bgClass: 'bg-orange-500/20',
    borderClass: 'border-orange-400/70',
    textClass: 'text-orange-200',
    dotColor: '#fb923c',
  },
  {
    id: 'H',
    name: 'Hyper',
    keyHint: '8',
    bgClass: 'bg-teal-500/20',
    borderClass: 'border-teal-400/70',
    textClass: 'text-teal-200',
    dotColor: '#2dd4bf',
  },
];

export const DECODE_CONFIGS: Record<DifficultySize, DecodeDifficultyConfig> = {
  4: {
    size: 4,
    codeLength: 4,
    tokenCount: 5,
    maxAttempts: 8,
    label: '4-Slot · 5 Signals',
  },
  5: {
    size: 5,
    codeLength: 4,
    tokenCount: 6,
    maxAttempts: 8,
    label: '4-Slot · 6 Signals',
  },
  6: {
    size: 6,
    codeLength: 5,
    tokenCount: 6,
    maxAttempts: 9,
    label: '5-Slot · 6 Signals',
  },
  7: {
    size: 7,
    codeLength: 5,
    tokenCount: 8,
    maxAttempts: 10,
    label: '5-Slot · 8 Signals',
  },
};

export function generateSecretCode(codeLength: number, tokenCount: number): string[] {
  const available = SIGNAL_TOKENS.slice(0, tokenCount);
  const code: string[] = [];
  for (let i = 0; i < codeLength; i++) {
    const pick = available[Math.floor(Math.random() * available.length)];
    code.push(pick.id);
  }
  return code;
}

export function evaluateDecodeGuess(guess: string[], secret: string[]): DecodeFeedback {
  let exact = 0;
  let present = 0;

  const secretRemaining: Record<string, number> = {};
  const guessRemaining: string[] = [];

  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      exact++;
    } else {
      secretRemaining[secret[i]] = (secretRemaining[secret[i]] ?? 0) + 1;
      guessRemaining.push(guess[i]);
    }
  }

  for (const token of guessRemaining) {
    if ((secretRemaining[token] ?? 0) > 0) {
      present++;
      secretRemaining[token]--;
    }
  }

  return { exact, present };
}

export function getTokenById(id: string): SignalToken | undefined {
  return SIGNAL_TOKENS.find((t) => t.id === id);
}
