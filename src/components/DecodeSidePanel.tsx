import React from 'react';
import { Eraser, Lightbulb, RotateCcw, Shuffle, Zap } from 'lucide-react';
import type { DecodeBestRecord, DecodeStatus } from '../types/circuit';
import { formatTime } from '../utils/puzzle';

interface DecodeSidePanelProps {
  attemptsUsed: number;
  maxAttempts: number;
  codeLength: number;
  tokenCount: number;
  seconds: number;
  totalDecoded: number;
  hintsUsed: number;
  maxHints: number;
  canClearRow: boolean;
  status: DecodeStatus;
  bestRecord?: DecodeBestRecord;
  onClearRow: () => void;
  onRevealHint: () => void;
  onRetryCipher: () => void;
  onTrickSolve: () => void;
  onNewCipher: () => void;
}

export const DecodeSidePanel: React.FC<DecodeSidePanelProps> = ({
  attemptsUsed,
  maxAttempts,
  codeLength,
  tokenCount,
  seconds,
  totalDecoded,
  hintsUsed,
  maxHints,
  canClearRow,
  status,
  bestRecord,
  onClearRow,
  onRevealHint,
  onRetryCipher,
  onTrickSolve,
  onNewCipher,
}) => {
  const remaining = Math.max(0, maxAttempts - attemptsUsed);
  const usedPct = maxAttempts > 0 ? Math.round((attemptsUsed / maxAttempts) * 100) : 0;

  let statusLabel = `${remaining} ${remaining === 1 ? 'try' : 'tries'} left`;
  if (status === 'WON') statusLabel = 'Decoded';
  if (status === 'LOST') statusLabel = 'Signal lost';

  return (
    <aside className="flex w-full flex-col justify-between gap-6 rounded-2xl border border-slate-800/90 bg-[#11192b]/95 p-5 sm:p-6">
      <div className="space-y-6">
        {/* Signal Specs & Progress */}
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-medium text-slate-400">Signal Matrix</span>
            <span className="font-mono text-xs text-slate-400 tabular-nums">{statusLabel}</span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-bold text-slate-50 tabular-nums">
              {attemptsUsed} / {maxAttempts}
            </span>
            <span className="font-mono text-xs text-sky-400 tabular-nums">
              {codeLength} slots · {tokenCount} signals
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                status === 'WON'
                  ? 'bg-emerald-400'
                  : status === 'LOST'
                    ? 'bg-rose-400'
                    : 'bg-sky-400'
              }`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-3 divide-x divide-slate-800/90 border-y border-slate-800/90 py-4">
          <div className="pr-3">
            <div className="text-xs text-slate-400">Attempts</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              {attemptsUsed}
            </div>
          </div>
          <div className="px-3">
            <div className="text-xs text-slate-400">Time</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              {formatTime(seconds)}
            </div>
          </div>
          <div className="pl-3">
            <div className="text-xs text-slate-400">Decoded</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              {totalDecoded}
            </div>
          </div>
        </div>

        {bestRecord && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Grid Best</span>
            <span className="font-mono text-slate-300 tabular-nums">
              {bestRecord.attempts} {bestRecord.attempts === 1 ? 'try' : 'tries'}{' '}
              <span aria-hidden="true">·</span> {formatTime(bestRecord.seconds)}
            </span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onClearRow}
              disabled={!canClearRow || status !== 'PLAYING'}
              className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-[#172138] px-4 py-2 text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors duration-150 hover:border-slate-600 hover:bg-[#1e2c49] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Eraser className="h-4 w-4 shrink-0" />
              <span>Clear Row</span>
            </button>

            <button
              type="button"
              onClick={onRevealHint}
              disabled={status !== 'PLAYING' || hintsUsed >= maxHints}
              className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-[#172138] px-4 py-2 text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors duration-150 hover:border-slate-600 hover:bg-[#1e2c49] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-300" />
              <span>Hint ({maxHints - hintsUsed})</span>
            </button>

            <button
              type="button"
              onClick={onRetryCipher}
              className="col-span-2 flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-[#172138] px-4 py-2 text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors duration-150 hover:border-slate-600 hover:bg-[#1e2c49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>Reset Attempts</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onTrickSolve}
            disabled={status !== 'PLAYING'}
            className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 whitespace-nowrap transition-colors duration-150 hover:border-amber-400/80 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Zap className="h-4 w-4 shrink-0" />
            <span>Trick Solve</span>
          </button>

          <button
            type="button"
            onClick={onNewCipher}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 whitespace-nowrap transition-colors duration-150 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <Shuffle className="h-4 w-4 shrink-0" />
            <span>New Cipher</span>
          </button>
        </div>
      </div>

      {/* Feedback & Controls Legend */}
      <div className="space-y-4 border-t border-slate-800/90 pt-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-300">Feedback Key</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
              <span>E = Exact slot</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border-2 border-amber-400"
                aria-hidden="true"
              />
              <span>P = Wrong slot</span>
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-slate-300">Controls</h2>
          <dl className="mt-2 space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center justify-between gap-2">
              <dt>Input signal</dt>
              <dd className="font-mono text-slate-300">Click / A–H / 1–8</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Cross out signal</dt>
              <dd className="font-mono text-slate-300">Right-Click Key</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Remove / Submit</dt>
              <dd className="font-mono text-slate-300">Backspace / Enter</dd>
            </div>
          </dl>
        </div>
      </div>
    </aside>
  );
};
