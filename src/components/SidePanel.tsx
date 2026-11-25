import React from 'react';
import { Eye, Pin, RotateCcw, Shuffle, Undo2, Zap } from 'lucide-react';
import type { BestRecord } from '../types/circuit';
import { formatTime } from '../utils/puzzle';

interface SidePanelProps {
  poweredCount: number;
  totalTiles: number;
  leakCount: number;
  moves: number;
  seconds: number;
  totalSolved: number;
  pinnedCount: number;
  canUndo: boolean;
  pinMode: boolean;
  showLeakHint: boolean;
  isTrickSolving: boolean;
  won: boolean;
  bestRecord?: BestRecord;
  onUndo: () => void;
  onReset: () => void;
  onTogglePinMode: () => void;
  onToggleLeakHint: () => void;
  onTrickSolve: () => void;
  onNewPuzzle: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  poweredCount,
  totalTiles,
  leakCount,
  moves,
  seconds,
  totalSolved,
  pinnedCount,
  canUndo,
  pinMode,
  showLeakHint,
  isTrickSolving,
  won,
  bestRecord,
  onUndo,
  onReset,
  onTogglePinMode,
  onToggleLeakHint,
  onTrickSolve,
  onNewPuzzle,
}) => {
  const powerPct = totalTiles > 0 ? Math.round((poweredCount / totalTiles) * 100) : 0;

  let circuitStatus = 'Routing';
  if (won) {
    circuitStatus = 'Complete';
  } else if (isTrickSolving) {
    circuitStatus = 'Auto-solving';
  } else if (poweredCount === totalTiles && leakCount > 0) {
    circuitStatus = `${leakCount} open ${leakCount === 1 ? 'end' : 'ends'}`;
  } else if (leakCount > 0 && showLeakHint) {
    circuitStatus = `${leakCount} open ${leakCount === 1 ? 'end' : 'ends'}`;
  }

  return (
    <aside className="flex w-full flex-col justify-between gap-6 rounded-2xl border border-slate-800/90 bg-[#11192b]/95 p-5 sm:p-6">
      <div className="space-y-6">
        {/* Power Progress */}
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-medium text-slate-400">Powered Nodes</span>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {circuitStatus}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-bold text-slate-50 tabular-nums">
              {poweredCount} / {totalTiles}
            </span>
            <span className="font-mono text-sm font-medium text-sky-400 tabular-nums">
              {powerPct}%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                won ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
              style={{ width: `${powerPct}%` }}
            />
          </div>
        </div>

        {/* Telemetry Grid separated by hairlines */}
        <div className="grid grid-cols-3 divide-x divide-slate-800/90 border-y border-slate-800/90 py-4">
          <div className="pr-3">
            <div className="text-xs text-slate-400">Moves</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              {moves}
            </div>
          </div>
          <div className="px-3">
            <div className="text-xs text-slate-400">Time</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              {formatTime(seconds)}
            </div>
          </div>
          <div className="pl-3">
            <div className="text-xs text-slate-400">Solved</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-100 tabular-nums">
              {totalSolved}
            </div>
          </div>
        </div>

        {bestRecord && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Grid Best</span>
            <span className="font-mono text-slate-300 tabular-nums">
              {bestRecord.moves} moves <span aria-hidden="true">·</span> {formatTime(bestRecord.seconds)}
            </span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo || won || isTrickSolving}
              className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-[#172138] px-4 py-2 text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors duration-150 hover:border-slate-600 hover:bg-[#1e2c49] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Undo2 className="h-4 w-4 shrink-0" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-[#172138] px-4 py-2 text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors duration-150 hover:border-slate-600 hover:bg-[#1e2c49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={onTogglePinMode}
              disabled={won || isTrickSolving}
              aria-pressed={pinMode}
              className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                pinMode
                  ? 'border-amber-400/70 bg-amber-500/15 text-amber-200'
                  : 'border-slate-700/80 bg-[#172138] text-slate-100 hover:border-slate-600 hover:bg-[#1e2c49]'
              }`}
            >
              <Pin className="h-4 w-4 shrink-0" />
              <span>Pin Mode{pinnedCount > 0 ? ` (${pinnedCount})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={onToggleLeakHint}
              aria-pressed={showLeakHint}
              className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                showLeakHint
                  ? 'border-sky-400/70 bg-sky-500/15 text-sky-200'
                  : 'border-slate-700/80 bg-[#172138] text-slate-100 hover:border-slate-600 hover:bg-[#1e2c49]'
              }`}
            >
              <Eye className="h-4 w-4 shrink-0" />
              <span>Open Ends</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onTrickSolve}
            disabled={won || isTrickSolving}
            className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 whitespace-nowrap transition-colors duration-150 hover:border-amber-400/80 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Zap className="h-4 w-4 shrink-0" />
            <span>{isTrickSolving ? 'Solving...' : 'Trick Solve'}</span>
          </button>

          <button
            type="button"
            onClick={onNewPuzzle}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 whitespace-nowrap transition-colors duration-150 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <Shuffle className="h-4 w-4 shrink-0" />
            <span>New Puzzle</span>
          </button>
        </div>
      </div>

      {/* Controls Reference */}
      <div className="border-t border-slate-800/90 pt-4">
        <h2 className="text-xs font-semibold text-slate-300">Controls</h2>
        <dl className="mt-2.5 space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <dt>Rotate clockwise</dt>
            <dd className="font-mono text-slate-300">Click / Tap</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>Rotate counter-clockwise</dt>
            <dd className="font-mono text-slate-300">Right-Click</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>Lock / unlock tile</dt>
            <dd className="font-mono text-slate-300">Shift + Click</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>Undo last turn</dt>
            <dd className="font-mono text-slate-300">Ctrl + Z</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
};
