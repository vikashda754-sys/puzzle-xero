import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Delete, Lock, Send } from 'lucide-react';
import type { DecodeAttempt, DecodeStatus } from '../types/circuit';
import { formatTime } from '../utils/puzzle';
import { SIGNAL_TOKENS, getTokenById } from '../utils/decode';

interface DecodeBoardProps {
  codeLength: number;
  tokenCount: number;
  maxAttempts: number;
  attempts: DecodeAttempt[];
  currentGuess: (string | null)[];
  selectedSlot: number;
  secretCode: string[];
  revealedHints: boolean[];
  eliminatedTokens: Record<string, boolean>;
  status: DecodeStatus;
  seconds: number;
  solvedByTrick?: boolean;
  onSelectSlot: (index: number) => void;
  onInsertToken: (tokenId: string) => void;
  onBackspace: () => void;
  onSubmitGuess: () => void;
  onToggleEliminateToken: (tokenId: string) => void;
  onNextCipher: () => void;
  onRetryCipher: () => void;
}

export const DecodeBoard: React.FC<DecodeBoardProps> = ({
  codeLength,
  tokenCount,
  maxAttempts,
  attempts,
  currentGuess,
  selectedSlot,
  secretCode,
  revealedHints,
  eliminatedTokens,
  status,
  seconds,
  solvedByTrick = false,
  onSelectSlot,
  onInsertToken,
  onBackspace,
  onSubmitGuess,
  onToggleEliminateToken,
  onNextCipher,
  onRetryCipher,
}) => {
  const availableTokens = SIGNAL_TOKENS.slice(0, tokenCount);
  const isRowComplete = currentGuess.every((val) => val !== null);
  const showTargetRevealed = status !== 'PLAYING';

  return (
    <div className="relative flex w-full max-w-[580px] flex-col gap-4 rounded-2xl border border-slate-800/90 bg-[#11192b] p-4 shadow-[0_20px_50px_rgba(2,6,23,0.6)] sm:p-5">
      {/* Encrypted Target Sequence Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/90 pb-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          <span>Target Signal</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {secretCode.map((tokenId, idx) => {
            const isRevealed = showTargetRevealed || revealedHints[idx];
            const token = isRevealed ? getTokenById(tokenId) : undefined;
            return (
              <div
                key={idx}
                aria-label={isRevealed && token ? `Slot ${idx + 1}: ${token.name}` : `Slot ${idx + 1}: encrypted`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-sm font-bold transition-colors sm:h-10 sm:w-10 ${
                  token
                    ? `${token.bgClass} ${token.borderClass} ${token.textClass}`
                    : 'border-slate-700/80 bg-[#172138] text-slate-500'
                }`}
              >
                {token ? token.id : '?'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Attempts History + Active Row */}
      <div className="flex flex-col gap-2" role="list" aria-label="Decode attempts">
        {Array.from({ length: maxAttempts }).map((_, rowIdx) => {
          const pastAttempt = attempts[rowIdx];
          const isActiveRow = status === 'PLAYING' && rowIdx === attempts.length;

          return (
            <div
              key={rowIdx}
              role="listitem"
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition-colors ${
                isActiveRow
                  ? 'border-sky-400/45 bg-[#15223b]'
                  : pastAttempt
                    ? 'border-slate-800/80 bg-[#131d33]'
                    : 'border-slate-800/40 bg-[#0e1526]/70'
              }`}
            >
              <span className="w-6 font-mono text-xs font-medium text-slate-500 tabular-nums">
                {String(rowIdx + 1).padStart(2, '0')}
              </span>

              {/* Slots */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {Array.from({ length: codeLength }).map((__, slotIdx) => {
                  const tokenId = pastAttempt
                    ? pastAttempt.guess[slotIdx]
                    : isActiveRow
                      ? currentGuess[slotIdx]
                      : null;
                  const token = tokenId ? getTokenById(tokenId) : undefined;
                  const isFocusedSlot = isActiveRow && selectedSlot === slotIdx;

                  if (isActiveRow) {
                    return (
                      <button
                        key={slotIdx}
                        type="button"
                        onClick={() => onSelectSlot(slotIdx)}
                        aria-label={`Active guess slot ${slotIdx + 1}${token ? `, ${token.name}` : ', empty'}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:h-11 sm:w-11 ${
                          token
                            ? `${token.bgClass} ${token.borderClass} ${token.textClass}`
                            : 'border-slate-700/80 bg-[#172138] text-slate-500 hover:border-slate-500'
                        } ${isFocusedSlot ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-[#15223b]' : ''}`}
                      >
                        {token ? token.id : ''}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={slotIdx}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-sm font-bold sm:h-11 sm:w-11 ${
                        token
                          ? `${token.bgClass} ${token.borderClass} ${token.textClass}`
                          : 'border-slate-800/70 bg-[#121a2d] text-slate-600'
                      }`}
                    >
                      {token ? token.id : ''}
                    </div>
                  );
                })}
              </div>

              {/* Feedback Pegs + Non-Hue Text Summary */}
              <div className="flex min-w-[92px] items-center justify-end gap-2.5 sm:min-w-[108px]">
                {pastAttempt ? (
                  <>
                    <div className="flex flex-wrap justify-end gap-1" aria-hidden="true">
                      {Array.from({ length: pastAttempt.feedback.exact }).map((_, i) => (
                        <span
                          key={`e-${i}`}
                          className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                        />
                      ))}
                      {Array.from({ length: pastAttempt.feedback.present }).map((_, i) => (
                        <span
                          key={`p-${i}`}
                          className="h-2.5 w-2.5 rounded-full border-2 border-amber-400 bg-transparent"
                        />
                      ))}
                      {Array.from({
                        length: Math.max(
                          0,
                          codeLength - pastAttempt.feedback.exact - pastAttempt.feedback.present
                        ),
                      }).map((_, i) => (
                        <span key={`n-${i}`} className="h-2.5 w-2.5 rounded-full bg-slate-700/80" />
                      ))}
                    </div>
                    <span
                      className="font-mono text-xs text-slate-300 tabular-nums"
                      aria-label={`${pastAttempt.feedback.exact} exact, ${pastAttempt.feedback.present} wrong slot`}
                    >
                      {pastAttempt.feedback.exact}E·{pastAttempt.feedback.present}P
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-xs text-slate-600 tabular-nums">
                    {isActiveRow ? 'Ready' : '—'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Signal Keypad */}
      <div className="border-t border-slate-800/90 pt-3.5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Signal Keypad</span>
          <span>Right-click key to cross out</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableTokens.map((token) => {
            const isEliminated = !!eliminatedTokens[token.id];
            return (
              <button
                key={token.id}
                type="button"
                disabled={status !== 'PLAYING'}
                onClick={(e) => {
                  if (e.shiftKey) {
                    onToggleEliminateToken(token.id);
                  } else {
                    onInsertToken(token.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onToggleEliminateToken(token.id);
                }}
                aria-label={`Signal ${token.name} (${token.id}), shortcut ${token.keyHint}${isEliminated ? ', crossed out' : ''}`}
                className={`relative flex min-h-[44px] min-w-[54px] flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 font-mono text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isEliminated
                    ? 'border-slate-800 bg-[#0e1526] text-slate-500 opacity-50 line-through'
                    : `${token.bgClass} ${token.borderClass} ${token.textClass} hover:brightness-110`
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: isEliminated ? '#475569' : token.dotColor }}
                  aria-hidden="true"
                />
                <span>{token.id}</span>
                <span className="text-[11px] font-normal opacity-65">{token.keyHint}</span>
              </button>
            );
          })}

          <button
            type="button"
            disabled={status !== 'PLAYING'}
            onClick={onBackspace}
            aria-label="Delete selected signal"
            title="Backspace"
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-700/80 bg-[#172138] px-3.5 py-2 text-slate-200 transition-colors hover:border-slate-600 hover:bg-[#1e2c49] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Delete className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={status !== 'PLAYING' || !isRowComplete}
            onClick={onSubmitGuess}
            aria-label="Submit guess"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 whitespace-nowrap transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Decode</span>
          </button>
        </div>
      </div>

      {/* Win / Loss Overlay */}
      {status !== 'PLAYING' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="decode-result-heading"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[#0b111e]/90 p-6 text-center backdrop-blur-sm transition-opacity duration-200"
        >
          <div
            className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border ${
              status === 'WON'
                ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-400'
                : 'border-rose-400/30 bg-rose-500/15 text-rose-400'
            }`}
          >
            {status === 'WON' ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <h2
            id="decode-result-heading"
            className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl"
          >
            {status === 'WON' ? 'Signal Decoded' : 'Signal Lost'}
          </h2>

          <p className="mt-2 font-mono text-sm text-slate-300 tabular-nums">
            {status === 'WON'
              ? solvedByTrick
                ? `Decoded via Trick Solve · ${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'} · ${formatTime(seconds)}`
                : `Cracked in ${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'} · ${formatTime(seconds)}`
              : `Out of attempts · ${formatTime(seconds)}`}
          </p>

          <div className="mt-4 flex items-center gap-2">
            {secretCode.map((tokenId, idx) => {
              const token = getTokenById(tokenId);
              return (
                <div
                  key={idx}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-sm font-bold ${
                    token
                      ? `${token.bgClass} ${token.borderClass} ${token.textClass}`
                      : 'border-slate-700 bg-[#172138] text-slate-200'
                  }`}
                >
                  {tokenId}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNextCipher}
              className={`flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-slate-950 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                status === 'WON'
                  ? 'bg-emerald-400 hover:bg-emerald-300 focus-visible:ring-emerald-300'
                  : 'bg-sky-400 hover:bg-sky-300 focus-visible:ring-sky-300'
              }`}
            >
              <span>{status === 'WON' ? 'Next Cipher' : 'New Cipher'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onRetryCipher}
              className="flex min-h-[44px] items-center rounded-lg border border-slate-700 bg-[#172138] px-4 py-2.5 text-sm font-semibold text-slate-200 whitespace-nowrap transition-colors hover:border-slate-600 hover:bg-[#1e2c49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Replay Same Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
