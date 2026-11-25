import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { DifficultySize, GameMode } from '../types/circuit';
import { DIFFICULTIES } from '../utils/puzzle';

interface HeaderBarProps {
  mode: GameMode;
  size: DifficultySize;
  level: number;
  decodeLevel: number;
  soundEnabled: boolean;
  onSelectSize: (size: DifficultySize) => void;
  onToggleSound: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  mode,
  size,
  level,
  decodeLevel,
  soundEnabled,
  onSelectSize,
  onToggleSound,
}) => {
  const activeDiff = DIFFICULTIES.find((d) => d.size === size) ?? DIFFICULTIES[1];

  return (
    <header className="w-full border-b border-slate-800/80 bg-[#0b111e]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-50 whitespace-nowrap sm:text-2xl">
            Circuit Link
          </h1>
          <span className="font-mono text-xs text-slate-400 whitespace-nowrap tabular-nums">
            {mode === 'CIRCUIT'
              ? `Level ${level} · ${activeDiff.label} ${activeDiff.tier}`
              : `Cipher ${decodeLevel} · ${activeDiff.tier}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label="Grid difficulty"
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#11192b] p-1"
          >
            {DIFFICULTIES.map((diff) => {
              const active = diff.size === size;
              return (
                <button
                  key={diff.size}
                  type="button"
                  onClick={() => onSelectSize(diff.size)}
                  aria-pressed={active}
                  className={`min-h-[34px] rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:px-3 ${
                    active
                      ? 'bg-sky-500/20 text-sky-200 ring-1 ring-inset ring-sky-400/40'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  {diff.label} <span className="hidden sm:inline">{diff.tier}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            aria-pressed={soundEnabled}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-[#11192b] text-slate-300 transition-colors duration-150 hover:border-slate-700 hover:bg-slate-800/70 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
