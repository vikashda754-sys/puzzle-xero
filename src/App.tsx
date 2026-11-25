import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Cpu, KeyRound } from 'lucide-react';
import { CircuitTile } from './components/CircuitTile';
import { DecodeBoard } from './components/DecodeBoard';
import { DecodeSidePanel } from './components/DecodeSidePanel';
import { HeaderBar } from './components/HeaderBar';
import { SidePanel } from './components/SidePanel';
import type {
  BestRecord,
  Coord,
  DecodeAttempt,
  DecodeBestRecord,
  DecodeStatus,
  DifficultySize,
  GameMode,
  GameStatus,
  MoveRecord,
  TileState,
} from './types/circuit';
import {
  DECODE_CONFIGS,
  SIGNAL_TOKENS,
  evaluateDecodeGuess,
  generateSecretCode,
} from './utils/decode';
import {
  computePowerState,
  createScrambledPuzzle,
  formatTime,
  getSolvedStepSequence,
} from './utils/puzzle';
import {
  playBlockedSound,
  playDecodeFailSound,
  playDecodeHintSound,
  playDecodeSubmitSound,
  playDecodeTapSound,
  playPinSound,
  playRotateSound,
  playUndoSound,
  playWinChime,
} from './utils/sound';

const SOLVED_STORAGE_KEY = 'circuit_link_solved';
const BEST_STORAGE_KEY = 'circuit_link_best_v1';
const DECODED_STORAGE_KEY = 'circuit_link_decoded_total';
const DECODE_BEST_STORAGE_KEY = 'circuit_link_decode_best_v1';

function loadNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [mode, setMode] = useState<GameMode>('CIRCUIT');
  const [size, setSize] = useState<DifficultySize>(5);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Circuit Link State
  const [level, setLevel] = useState<number>(1);
  const [initialPuzzle] = useState(() => createScrambledPuzzle(5));
  const [grid, setGrid] = useState<TileState[][]>(initialPuzzle.grid);
  const [source, setSource] = useState<Coord>(initialPuzzle.source);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>('PLAYING');
  const [pinMode, setPinMode] = useState<boolean>(false);
  const [showLeakHint, setShowLeakHint] = useState<boolean>(false);
  const [isTrickSolving, setIsTrickSolving] = useState<boolean>(false);
  const [circuitSolvedByTrick, setCircuitSolvedByTrick] = useState<boolean>(false);
  const [totalSolved, setTotalSolved] = useState<number>(() => loadNumber(SOLVED_STORAGE_KEY));
  const [bestRecords, setBestRecords] = useState<Partial<Record<DifficultySize, BestRecord>>>(() =>
    loadJSON(BEST_STORAGE_KEY, {})
  );
  const trickTimerRef = useRef<number | null>(null);

  // Decode Cipher State
  const decodeConfig = DECODE_CONFIGS[size];
  const [decodeLevel, setDecodeLevel] = useState<number>(1);
  const [secretCode, setSecretCode] = useState<string[]>(() =>
    generateSecretCode(DECODE_CONFIGS[5].codeLength, DECODE_CONFIGS[5].tokenCount)
  );
  const [decodeAttempts, setDecodeAttempts] = useState<DecodeAttempt[]>([]);
  const [currentGuess, setCurrentGuess] = useState<(string | null)[]>(() =>
    Array(DECODE_CONFIGS[5].codeLength).fill(null)
  );
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [revealedHints, setRevealedHints] = useState<boolean[]>(() =>
    Array(DECODE_CONFIGS[5].codeLength).fill(false)
  );
  const [eliminatedTokens, setEliminatedTokens] = useState<Record<string, boolean>>({});
  const [decodeStatus, setDecodeStatus] = useState<DecodeStatus>('PLAYING');
  const [decodeSeconds, setDecodeSeconds] = useState<number>(0);
  const [decodeTimerActive, setDecodeTimerActive] = useState<boolean>(false);
  const [decodeSolvedByTrick, setDecodeSolvedByTrick] = useState<boolean>(false);
  const [totalDecoded, setTotalDecoded] = useState<number>(() => loadNumber(DECODED_STORAGE_KEY));
  const [decodeBestRecords, setDecodeBestRecords] = useState<
    Partial<Record<DifficultySize, DecodeBestRecord>>
  >(() => loadJSON(DECODE_BEST_STORAGE_KEY, {}));

  const powerAnalysis = useMemo(() => computePowerState(grid, source), [grid, source]);

  const pinnedCount = useMemo(
    () =>
      grid.reduce(
        (acc, row) => acc + row.reduce((rowAcc, cell) => rowAcc + (cell.pinned ? 1 : 0), 0),
        0
      ),
    [grid]
  );

  const stopTrickSolve = useCallback(() => {
    if (trickTimerRef.current !== null) {
      window.clearTimeout(trickTimerRef.current);
      trickTimerRef.current = null;
    }
    setIsTrickSolving(false);
  }, []);

  useEffect(() => {
    return () => {
      if (trickTimerRef.current !== null) {
        window.clearTimeout(trickTimerRef.current);
      }
    };
  }, []);

  // Circuit timer (only ticks while playing Circuit mode)
  useEffect(() => {
    if (mode !== 'CIRCUIT' || !timerActive || status === 'WON') return;
    const id = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, timerActive, status]);

  // Decode timer (only ticks while playing Decode mode)
  useEffect(() => {
    if (mode !== 'DECODE' || !decodeTimerActive || decodeStatus !== 'PLAYING') return;
    const id = window.setInterval(() => {
      setDecodeSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, decodeTimerActive, decodeStatus]);

  const startNewCircuitPuzzle = useCallback(
    (nextSize: DifficultySize, incrementLevel: boolean) => {
      stopTrickSolve();
      const next = createScrambledPuzzle(nextSize);
      setGrid(next.grid);
      setSource(next.source);
      setMoves(0);
      setSeconds(0);
      setTimerActive(false);
      setHistory([]);
      setStatus('PLAYING');
      setCircuitSolvedByTrick(false);
      setLevel((prev) => (incrementLevel ? prev + 1 : nextSize !== size ? 1 : prev));
    },
    [size, stopTrickSolve]
  );

  const startNewDecodeCipher = useCallback(
    (nextSize: DifficultySize, incrementLevel: boolean) => {
      const cfg = DECODE_CONFIGS[nextSize];
      setSecretCode(generateSecretCode(cfg.codeLength, cfg.tokenCount));
      setDecodeAttempts([]);
      setCurrentGuess(Array(cfg.codeLength).fill(null));
      setSelectedSlot(0);
      setRevealedHints(Array(cfg.codeLength).fill(false));
      setEliminatedTokens({});
      setDecodeStatus('PLAYING');
      setDecodeSeconds(0);
      setDecodeTimerActive(false);
      setDecodeSolvedByTrick(false);
      setDecodeLevel((prev) => (incrementLevel ? prev + 1 : nextSize !== size ? 1 : prev));
    },
    [size]
  );

  const handleSelectSize = useCallback(
    (nextSize: DifficultySize) => {
      setSize(nextSize);
      startNewCircuitPuzzle(nextSize, false);
      startNewDecodeCipher(nextSize, false);
    },
    [startNewCircuitPuzzle, startNewDecodeCipher]
  );

  // Circuit Link Handlers
  const handleCompleteWin = useCallback(
    (finalMoves: number, finalSeconds: number, assisted: boolean) => {
      setStatus('WON');
      setTimerActive(false);
      setIsTrickSolving(false);
      setCircuitSolvedByTrick(assisted);
      playWinChime(soundEnabled);

      setTotalSolved((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(SOLVED_STORAGE_KEY, String(next));
        } catch {
          // Ignore storage failures
        }
        return next;
      });

      if (!assisted) {
        setBestRecords((prev) => {
          const currentBest = prev[size];
          const isBetter =
            !currentBest ||
            finalMoves < currentBest.moves ||
            (finalMoves === currentBest.moves && finalSeconds < currentBest.seconds);
          if (!isBetter) return prev;
          const updated = {
            ...prev,
            [size]: { moves: finalMoves, seconds: finalSeconds },
          };
          try {
            localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage failures
          }
          return updated;
        });
      }
    },
    [size, soundEnabled]
  );

  const applyRotation = useCallback(
    (r: number, c: number, delta: number, isUndo = false) => {
      if (status === 'WON' || isTrickSolving) return;
      const target = grid[r]?.[c];
      if (!target) return;

      if (!isUndo && target.pinned) {
        playBlockedSound(soundEnabled);
        return;
      }
      if (target.baseMask === 15) return;

      if (!isUndo && !timerActive) {
        setTimerActive(true);
      }

      const nextGrid = grid.map((row, ri) =>
        ri === r
          ? row.map((cell, ci) =>
              ci === c
                ? {
                    ...cell,
                    rot: (((cell.rot + delta) % 4) + 4) % 4,
                    visualRot: cell.visualRot + delta,
                  }
                : cell
            )
          : row
      );

      const nextMoves = isUndo ? Math.max(0, moves - 1) : moves + 1;
      setGrid(nextGrid);
      setMoves(nextMoves);

      if (!isUndo) {
        setHistory((prev) => [...prev, { r, c, delta }]);
        playRotateSound(soundEnabled, delta > 0);
      } else {
        playUndoSound(soundEnabled);
      }

      const analysis = computePowerState(nextGrid, source);
      if (analysis.isComplete) {
        handleCompleteWin(nextMoves, seconds, false);
      }
    },
    [
      grid,
      isTrickSolving,
      moves,
      seconds,
      soundEnabled,
      source,
      status,
      timerActive,
      handleCompleteWin,
    ]
  );

  const handleTrickSolveCircuit = useCallback(() => {
    if (status === 'WON' || isTrickSolving) return;

    const steps = getSolvedStepSequence(grid, source);
    if (steps.length === 0) {
      const analysis = computePowerState(grid, source);
      if (analysis.isComplete) {
        handleCompleteWin(moves, seconds, true);
      }
      return;
    }

    setIsTrickSolving(true);
    setPinMode(false);

    let stepIndex = 0;
    let workingGrid = grid.map((row) => row.map((cell) => ({ ...cell, pinned: false })));
    let workingMoves = moves;

    setGrid(workingGrid);

    const runNextStep = () => {
      const step = steps[stepIndex];
      if (!step) {
        trickTimerRef.current = null;
        handleCompleteWin(workingMoves, seconds, true);
        return;
      }

      workingGrid = workingGrid.map((row, ri) =>
        ri === step.r
          ? row.map((cell, ci) =>
              ci === step.c
                ? {
                    ...cell,
                    rot: (((cell.rot + step.delta) % 4) + 4) % 4,
                    visualRot: cell.visualRot + step.delta,
                    pinned: false,
                  }
                : cell
            )
          : row
      );
      workingMoves += 1;

      setGrid(workingGrid);
      setMoves(workingMoves);
      playRotateSound(soundEnabled, step.delta > 0);

      stepIndex += 1;
      const analysis = computePowerState(workingGrid, source);
      if (analysis.isComplete || stepIndex >= steps.length) {
        trickTimerRef.current = window.setTimeout(() => {
          trickTimerRef.current = null;
          handleCompleteWin(workingMoves, seconds, true);
        }, 140);
        return;
      }

      trickTimerRef.current = window.setTimeout(runNextStep, 60);
    };

    trickTimerRef.current = window.setTimeout(runNextStep, 40);
  }, [grid, handleCompleteWin, isTrickSolving, moves, seconds, soundEnabled, source, status]);

  const handleTogglePin = useCallback(
    (r: number, c: number) => {
      if (status === 'WON' || isTrickSolving) return;
      const current = grid[r]?.[c];
      if (!current) return;
      const nextPinned = !current.pinned;

      setGrid((prev) =>
        prev.map((row, ri) =>
          ri === r
            ? row.map((cell, ci) => (ci === c ? { ...cell, pinned: nextPinned } : cell))
            : row
        )
      );
      playPinSound(soundEnabled, nextPinned);
    },
    [grid, isTrickSolving, soundEnabled, status]
  );

  const handleUndo = useCallback(() => {
    if (status === 'WON' || isTrickSolving || history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    applyRotation(last.r, last.c, -last.delta, true);
  }, [applyRotation, history, isTrickSolving, status]);

  const handleResetCircuit = useCallback(() => {
    stopTrickSolve();
    setTimerActive(false);
    setMoves(0);
    setSeconds(0);
    setHistory([]);
    setStatus('PLAYING');
    setCircuitSolvedByTrick(false);
    setGrid((prev) =>
      prev.map((row) =>
        row.map((cell) => ({
          ...cell,
          rot: cell.initialRot,
          visualRot: cell.initialRot,
          pinned: false,
        }))
      )
    );
  }, [stopTrickSolve]);

  // Decode Cipher Handlers
  const handleSelectDecodeSlot = useCallback(
    (idx: number) => {
      if (decodeStatus !== 'PLAYING') return;
      if (selectedSlot === idx && currentGuess[idx] !== null) {
        setCurrentGuess((prev) => prev.map((v, i) => (i === idx ? null : v)));
        playUndoSound(soundEnabled);
      } else {
        setSelectedSlot(idx);
      }
    },
    [currentGuess, decodeStatus, selectedSlot, soundEnabled]
  );

  const handleInsertToken = useCallback(
    (tokenId: string) => {
      if (decodeStatus !== 'PLAYING') return;
      if (!decodeTimerActive) {
        setDecodeTimerActive(true);
      }

      const tokenIdx = SIGNAL_TOKENS.findIndex((t) => t.id === tokenId);
      playDecodeTapSound(soundEnabled, tokenIdx >= 0 ? tokenIdx : 0);

      const nextGuess = [...currentGuess];
      nextGuess[selectedSlot] = tokenId;
      setCurrentGuess(nextGuess);

      const nextEmptyAfter = nextGuess.findIndex((v, i) => i > selectedSlot && v === null);
      if (nextEmptyAfter !== -1) {
        setSelectedSlot(nextEmptyAfter);
      } else {
        const firstEmpty = nextGuess.findIndex((v) => v === null);
        if (firstEmpty !== -1) {
          setSelectedSlot(firstEmpty);
        } else {
          setSelectedSlot(Math.min(decodeConfig.codeLength - 1, selectedSlot + 1));
        }
      }
    },
    [
      currentGuess,
      decodeConfig.codeLength,
      decodeStatus,
      decodeTimerActive,
      selectedSlot,
      soundEnabled,
    ]
  );

  const handleDecodeBackspace = useCallback(() => {
    if (decodeStatus !== 'PLAYING') return;
    if (currentGuess[selectedSlot] !== null) {
      setCurrentGuess((prev) => prev.map((v, i) => (i === selectedSlot ? null : v)));
      playUndoSound(soundEnabled);
      return;
    }
    const prevFilled = [...currentGuess]
      .slice(0, selectedSlot)
      .reverse()
      .findIndex((v) => v !== null);
    if (prevFilled !== -1) {
      const targetIdx = selectedSlot - 1 - prevFilled;
      setCurrentGuess((prev) => prev.map((v, i) => (i === targetIdx ? null : v)));
      setSelectedSlot(targetIdx);
      playUndoSound(soundEnabled);
    }
  }, [currentGuess, decodeStatus, selectedSlot, soundEnabled]);

  const handleClearDecodeRow = useCallback(() => {
    if (decodeStatus !== 'PLAYING') return;
    setCurrentGuess(Array(decodeConfig.codeLength).fill(null));
    setSelectedSlot(0);
    playUndoSound(soundEnabled);
  }, [decodeConfig.codeLength, decodeStatus, soundEnabled]);

  const finishDecodeWin = useCallback(
    (nextAttempts: DecodeAttempt[], assisted: boolean) => {
      setDecodeStatus('WON');
      setDecodeTimerActive(false);
      setDecodeSolvedByTrick(assisted);
      playWinChime(soundEnabled);

      setTotalDecoded((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(DECODED_STORAGE_KEY, String(next));
        } catch {
          // Ignore storage failures
        }
        return next;
      });

      if (!assisted) {
        setDecodeBestRecords((prev) => {
          const currentBest = prev[size];
          const count = nextAttempts.length;
          const isBetter =
            !currentBest ||
            count < currentBest.attempts ||
            (count === currentBest.attempts && decodeSeconds < currentBest.seconds);
          if (!isBetter) return prev;
          const updated = {
            ...prev,
            [size]: { attempts: count, seconds: decodeSeconds },
          };
          try {
            localStorage.setItem(DECODE_BEST_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage failures
          }
          return updated;
        });
      }
    },
    [decodeSeconds, size, soundEnabled]
  );

  const handleSubmitDecodeGuess = useCallback(() => {
    if (decodeStatus !== 'PLAYING') return;
    if (currentGuess.some((v) => v === null)) return;

    const guess = currentGuess as string[];
    const feedback = evaluateDecodeGuess(guess, secretCode);
    const nextAttempts = [...decodeAttempts, { guess, feedback }];

    setDecodeAttempts(nextAttempts);
    setCurrentGuess(Array(decodeConfig.codeLength).fill(null));
    setSelectedSlot(0);

    if (feedback.exact === decodeConfig.codeLength) {
      finishDecodeWin(nextAttempts, false);
      return;
    }

    if (nextAttempts.length >= decodeConfig.maxAttempts) {
      setDecodeStatus('LOST');
      setDecodeTimerActive(false);
      playDecodeFailSound(soundEnabled);
      return;
    }

    playDecodeSubmitSound(soundEnabled);
  }, [
    currentGuess,
    decodeAttempts,
    decodeConfig.codeLength,
    decodeConfig.maxAttempts,
    decodeStatus,
    finishDecodeWin,
    secretCode,
    soundEnabled,
  ]);

  const handleTrickSolveDecode = useCallback(() => {
    if (decodeStatus !== 'PLAYING') return;

    const feedback = evaluateDecodeGuess(secretCode, secretCode);
    const nextAttempts = [...decodeAttempts, { guess: [...secretCode], feedback }];

    setDecodeAttempts(nextAttempts);
    setCurrentGuess(Array(decodeConfig.codeLength).fill(null));
    setSelectedSlot(0);
    setRevealedHints(Array(decodeConfig.codeLength).fill(true));
    finishDecodeWin(nextAttempts, true);
  }, [decodeAttempts, decodeConfig.codeLength, decodeStatus, finishDecodeWin, secretCode]);

  const handleRevealHint = useCallback(() => {
    if (decodeStatus !== 'PLAYING') return;
    const unrevealedIndices = revealedHints
      .map((revealed, idx) => (!revealed ? idx : -1))
      .filter((idx) => idx !== -1);

    const maxHints = Math.max(1, decodeConfig.codeLength - 1);
    const hintsUsed = revealedHints.filter(Boolean).length;
    if (hintsUsed >= maxHints || unrevealedIndices.length === 0) return;

    if (!decodeTimerActive) {
      setDecodeTimerActive(true);
    }

    const pickIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    setRevealedHints((prev) => prev.map((v, i) => (i === pickIdx ? true : v)));
    setCurrentGuess((prev) => prev.map((v, i) => (i === pickIdx ? secretCode[pickIdx] : v)));
    playDecodeHintSound(soundEnabled);
  }, [
    decodeConfig.codeLength,
    decodeStatus,
    decodeTimerActive,
    revealedHints,
    secretCode,
    soundEnabled,
  ]);

  const handleToggleEliminateToken = useCallback(
    (tokenId: string) => {
      setEliminatedTokens((prev) => {
        const nextVal = !prev[tokenId];
        playPinSound(soundEnabled, nextVal);
        return { ...prev, [tokenId]: nextVal };
      });
    },
    [soundEnabled]
  );

  const handleRetrySameCipher = useCallback(() => {
    setDecodeAttempts([]);
    setCurrentGuess(Array(decodeConfig.codeLength).fill(null));
    setSelectedSlot(0);
    setRevealedHints(Array(decodeConfig.codeLength).fill(false));
    setEliminatedTokens({});
    setDecodeStatus('PLAYING');
    setDecodeSeconds(0);
    setDecodeTimerActive(false);
    setDecodeSolvedByTrick(false);
  }, [decodeConfig.codeLength]);

  // Global keyboard shortcuts per mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (mode === 'CIRCUIT') {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      if (mode === 'DECODE' && decodeStatus === 'PLAYING') {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const key = e.key.toUpperCase();
        const available = SIGNAL_TOKENS.slice(0, decodeConfig.tokenCount);

        const matchedByLetter = available.find((t) => t.id === key);
        const matchedByNumber = available.find((t) => t.keyHint === key);
        const matched = matchedByLetter || matchedByNumber;

        if (matched) {
          e.preventDefault();
          handleInsertToken(matched.id);
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          handleDecodeBackspace();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmitDecodeGuess();
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedSlot((prev) => Math.max(0, prev - 1));
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedSlot((prev) => Math.min(decodeConfig.codeLength - 1, prev + 1));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    decodeConfig.codeLength,
    decodeConfig.tokenCount,
    decodeStatus,
    handleDecodeBackspace,
    handleInsertToken,
    handleSubmitDecodeGuess,
    handleUndo,
    mode,
  ]);

  const totalTiles = size * size;
  const highlightLeaks =
    showLeakHint || (powerAnalysis.poweredCount === totalTiles && powerAnalysis.leakCount > 0);
  const hintsUsed = revealedHints.filter(Boolean).length;
  const maxHints = Math.max(1, decodeConfig.codeLength - 1);

  return (
    <div className="bg-circuit-grid flex min-h-screen flex-col">
      <HeaderBar
        mode={mode}
        size={size}
        level={level}
        decodeLevel={decodeLevel}
        soundEnabled={soundEnabled}
        onSelectSize={handleSelectSize}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 lg:py-8">
        {/* Workspace Mode Switcher */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Puzzle mode"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-[#11192b] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'CIRCUIT'}
              onClick={() => setMode('CIRCUIT')}
              className={`flex min-h-[38px] items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                mode === 'CIRCUIT'
                  ? 'bg-sky-500/20 text-sky-200 ring-1 ring-inset ring-sky-400/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Cpu className="h-4 w-4 shrink-0" />
              <span>Circuit Link</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'DECODE'}
              onClick={() => {
                stopTrickSolve();
                setMode('DECODE');
              }}
              className={`flex min-h-[38px] items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                mode === 'DECODE'
                  ? 'bg-sky-500/20 text-sky-200 ring-1 ring-inset ring-sky-400/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <KeyRound className="h-4 w-4 shrink-0" />
              <span>Decode Cipher</span>
            </button>
          </div>

          <p className="text-sm text-slate-400">
            {mode === 'CIRCUIT'
              ? 'Route power from the central core to every terminal node with zero open ends.'
              : 'Deduce the encrypted signal sequence using exact and wrong-slot feedback. Repeats allowed.'}
          </p>
        </div>

        {mode === 'CIRCUIT' ? (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Circuit Link Board */}
            <section aria-label="Circuit board" className="flex flex-col items-center">
              {pinMode && (
                <div className="mb-2 flex w-full max-w-[580px] justify-end">
                  <span className="text-xs font-medium text-amber-300">Pin mode active</span>
                </div>
              )}

              <div className="relative w-full max-w-[580px] rounded-2xl border border-slate-800/90 bg-[#11192b] p-3 shadow-[0_20px_50px_rgba(2,6,23,0.6)] sm:p-4">
                <div
                  className="grid aspect-square w-full gap-1.5 sm:gap-2"
                  style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
                >
                  {grid.map((row, r) =>
                    row.map((tile, c) => (
                      <CircuitTile
                        key={`${r}-${c}`}
                        row={r}
                        col={c}
                        tile={tile}
                        isSource={r === source.r && c === source.c}
                        isPowered={powerAnalysis.powered[r]?.[c] ?? false}
                        isLeakingPowered={
                          highlightLeaks && (powerAnalysis.leakingTiles[r]?.[c] ?? false)
                        }
                        pinMode={pinMode}
                        won={status === 'WON' || isTrickSolving}
                        onRotate={(rr, cc, delta) => applyRotation(rr, cc, delta, false)}
                        onTogglePin={handleTogglePin}
                      />
                    ))
                  )}
                </div>

                {status === 'WON' && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="win-heading"
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[#0b111e]/88 p-6 text-center backdrop-blur-sm transition-opacity duration-200"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h2 id="win-heading" className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                      Circuit Complete
                    </h2>
                    <p className="mt-2 font-mono text-sm text-slate-300 tabular-nums">
                      {circuitSolvedByTrick
                        ? `Solved via Trick Solve · ${moves} ${moves === 1 ? 'move' : 'moves'} · ${formatTime(seconds)}`
                        : `Solved in ${moves} ${moves === 1 ? 'move' : 'moves'} · ${formatTime(seconds)}`}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => startNewCircuitPuzzle(size, true)}
                        className="flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 whitespace-nowrap transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                      >
                        <span>Next Puzzle</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleResetCircuit}
                        className="flex min-h-[44px] items-center rounded-lg border border-slate-700 bg-[#172138] px-4 py-2.5 text-sm font-semibold text-slate-200 whitespace-nowrap transition-colors duration-150 hover:border-slate-600 hover:bg-[#1e2c49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      >
                        Replay Board
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Circuit Side Rail */}
            <div className="mx-auto w-full max-w-[580px] lg:mx-0 lg:max-w-none">
              <SidePanel
                poweredCount={powerAnalysis.poweredCount}
                totalTiles={totalTiles}
                leakCount={powerAnalysis.leakCount}
                moves={moves}
                seconds={seconds}
                totalSolved={totalSolved}
                pinnedCount={pinnedCount}
                canUndo={history.length > 0}
                pinMode={pinMode}
                showLeakHint={showLeakHint}
                isTrickSolving={isTrickSolving}
                won={status === 'WON'}
                bestRecord={bestRecords[size]}
                onUndo={handleUndo}
                onReset={handleResetCircuit}
                onTogglePinMode={() => setPinMode((prev) => !prev)}
                onToggleLeakHint={() => setShowLeakHint((prev) => !prev)}
                onTrickSolve={handleTrickSolveCircuit}
                onNewPuzzle={() => startNewCircuitPuzzle(size, false)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Decode Cipher Board */}
            <section aria-label="Decode cipher board" className="flex flex-col items-center">
              <DecodeBoard
                codeLength={decodeConfig.codeLength}
                tokenCount={decodeConfig.tokenCount}
                maxAttempts={decodeConfig.maxAttempts}
                attempts={decodeAttempts}
                currentGuess={currentGuess}
                selectedSlot={selectedSlot}
                secretCode={secretCode}
                revealedHints={revealedHints}
                eliminatedTokens={eliminatedTokens}
                status={decodeStatus}
                seconds={decodeSeconds}
                solvedByTrick={decodeSolvedByTrick}
                onSelectSlot={handleSelectDecodeSlot}
                onInsertToken={handleInsertToken}
                onBackspace={handleDecodeBackspace}
                onSubmitGuess={handleSubmitDecodeGuess}
                onToggleEliminateToken={handleToggleEliminateToken}
                onNextCipher={() => startNewDecodeCipher(size, decodeStatus === 'WON')}
                onRetryCipher={handleRetrySameCipher}
              />
            </section>

            {/* Decode Side Rail */}
            <div className="mx-auto w-full max-w-[580px] lg:mx-0 lg:max-w-none">
              <DecodeSidePanel
                attemptsUsed={decodeAttempts.length}
                maxAttempts={decodeConfig.maxAttempts}
                codeLength={decodeConfig.codeLength}
                tokenCount={decodeConfig.tokenCount}
                seconds={decodeSeconds}
                totalDecoded={totalDecoded}
                hintsUsed={hintsUsed}
                maxHints={maxHints}
                canClearRow={currentGuess.some((v) => v !== null)}
                status={decodeStatus}
                bestRecord={decodeBestRecords[size]}
                onClearRow={handleClearDecodeRow}
                onRevealHint={handleRevealHint}
                onRetryCipher={handleRetrySameCipher}
                onTrickSolve={handleTrickSolveDecode}
                onNewCipher={() => startNewDecodeCipher(size, false)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
