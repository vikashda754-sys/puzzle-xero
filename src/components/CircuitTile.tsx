import React, { useState } from 'react';
import type { TileState } from '../types/circuit';
import { describeTileType, popCount } from '../utils/puzzle';

interface CircuitTileProps {
  row: number;
  col: number;
  tile: TileState;
  isSource: boolean;
  isPowered: boolean;
  isLeakingPowered: boolean;
  pinMode: boolean;
  won: boolean;
  onRotate: (r: number, c: number, delta: number) => void;
  onTogglePin: (r: number, c: number) => void;
}

export const CircuitTile: React.FC<CircuitTileProps> = ({
  row,
  col,
  tile,
  isSource,
  isPowered,
  isLeakingPowered,
  pinMode,
  won,
  onRotate,
  onTogglePin,
}) => {
  const [nudging, setNudging] = useState(false);

  const deg = popCount(tile.baseMask);
  const tileType = describeTileType(tile.baseMask);

  const triggerNudge = () => {
    setNudging(true);
    window.setTimeout(() => setNudging(false), 200);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (won) return;
    if (e.shiftKey || pinMode) {
      onTogglePin(row, col);
      return;
    }
    if (tile.pinned) {
      triggerNudge();
    }
    onRotate(row, col, 1);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (won) return;
    if (tile.pinned) {
      triggerNudge();
    }
    onRotate(row, col, -1);
  };

  const outerStroke = isPowered ? '#0ea5e9' : '#334466';
  const innerStroke = isPowered ? '#bae6fd' : '#516792';
  const hubOuterFill = isPowered ? '#0ea5e9' : '#334466';
  const hubInnerFill = isPowered ? '#e0f2fe' : '#516792';

  const bulbOuterFill = isPowered ? '#064e3b' : '#1e2c4a';
  const bulbOuterStroke = isPowered ? '#10b981' : '#334466';
  const bulbInnerFill = isPowered ? '#34d399' : '#516792';

  const outerLines: React.ReactNode[] = [];
  const innerLines: React.ReactNode[] = [];

  if (tile.baseMask & 1) {
    outerLines.push(
      <line
        key="out-u"
        x1="50"
        y1="50"
        x2="50"
        y2="0"
        stroke={outerStroke}
        strokeWidth="22"
        strokeLinecap="butt"
        className="transition-colors duration-200"
      />
    );
    innerLines.push(
      <line
        key="in-u"
        x1="50"
        y1="50"
        x2="50"
        y2="0"
        stroke={innerStroke}
        strokeWidth="9"
        strokeLinecap="butt"
        className="transition-colors duration-200"
      />
    );
  }
  if (tile.baseMask & 2) {
    outerLines.push(
      <line
        key="out-r"
        x1="50"
        y1="50"
        x2="100"
        y2="50"
        stroke={outerStroke}
        strokeWidth="22"
        strokeLinecap="butt"
        className="transition-colors duration-200"
      />
    );
    innerLines.push(
      <line
        key="in-r"
        x1="50"
        y1="50"
        x2="100"
        y2="50"
        stroke={innerStroke}
        strokeWidth="9"
        strokeLinecap="butt"
        className="transition-colors duration-200"
      />
    );
  }
  if (tile.baseMask & 4) {
    outerLines.push(
      <line
        key="out-d"
        x1="50"
        y1="50"
        x2="50"
        y2="100"
        stroke={outerStroke}
        strokeWidth="22"
        strokeLinecap="butt"
        className="transition-colors duration-200"
      />
    );
    innerLines.push(
      <line
        key="in-d"
        x1="50"
        y1="50"
        x2="50"
        y2="100"
        stroke={innerStroke}
        strokeWidth="9"
        strokeLinecap="butt"
        className="transition-colors duration-200"
      />
    );
  }
  if (tile.baseMask & 8) {
    outerLines.push(
      <line
        key="out-l"
        x1="50"
        y1="50"
        x2="0"
        y2="50"
        stroke={outerStroke}
        strokeWidth="22"
        strokeLinecap="butt"
        className="transition-colors duration-200"
      />
    );
    innerLines.push(
      <line
        key="in-l"
        x1="50"
        y1="50"
        x2="0"
        y2="50"
        stroke={innerStroke}
        strokeWidth="9"
        strokeLinecap="butt"
        className="transition-colors duration-200"
      />
    );
  }

  let borderClass = 'border-slate-700/40 hover:border-slate-500/60';
  let bgClass = 'bg-[#172138] hover:bg-[#1d2a46]';

  if (isPowered) {
    bgClass = 'bg-[#12263f] hover:bg-[#17304f]';
    borderClass = 'border-sky-400/30 hover:border-sky-400/50';
  }
  if (isLeakingPowered) {
    borderClass = 'border-amber-400/55 hover:border-amber-300/75';
  }
  if (tile.pinned) {
    bgClass = isPowered ? 'bg-[#182942]' : 'bg-[#1b243b]';
    borderClass = 'border-amber-400/65 hover:border-amber-300';
  }
  if (isSource) {
    borderClass = 'border-amber-400/60';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      aria-label={`Row ${row + 1}, Column ${col + 1}, ${tileType}${isSource ? ', power core' : ''}${isPowered ? ', energized' : ''}${tile.pinned ? ', pinned' : ''}`}
      className={`group relative flex aspect-square w-full min-h-[40px] items-center justify-center overflow-hidden rounded-lg border p-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0b111e] ${bgClass} ${borderClass} ${
        nudging ? 'animate-tile-nudge' : ''
      } ${won ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <div
        className="pipe-rotor pointer-events-none h-full w-full"
        style={{
          transform: `rotate(${tile.visualRot * 90}deg)`,
          filter: isPowered ? 'drop-shadow(0 0 5px rgba(14, 165, 233, 0.35))' : undefined,
        }}
      >
        <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden="true">
          {outerLines}
          {innerLines}
          {deg === 1 ? (
            <>
              <circle
                cx="50"
                cy="50"
                r="20"
                fill={bulbOuterFill}
                stroke={bulbOuterStroke}
                strokeWidth="5"
                className="transition-colors duration-200"
              />
              <circle
                cx="50"
                cy="50"
                r="8"
                fill={bulbInnerFill}
                className="transition-colors duration-200"
              />
            </>
          ) : (
            <>
              <circle
                cx="50"
                cy="50"
                r="11"
                fill={hubOuterFill}
                className="transition-colors duration-200"
              />
              <circle
                cx="50"
                cy="50"
                r="5"
                fill={hubInnerFill}
                className="transition-colors duration-200"
              />
            </>
          )}
        </svg>
      </div>

      {isSource && (
        <div
          className="animate-source-pulse pointer-events-none absolute flex h-[38%] w-[38%] items-center justify-center rounded-full shadow-[0_0_16px_rgba(251,191,36,0.8)]"
          style={{
            background: 'radial-gradient(circle, #fef3c7 0%, #f59e0b 68%, #b45309 100%)',
          }}
          aria-hidden="true"
        >
          <div className="h-[42%] w-[42%] rounded-full bg-amber-50" />
        </div>
      )}

      {tile.pinned && (
        <span
          className="pointer-events-none absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
