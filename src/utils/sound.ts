let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration = 0.06,
  type: OscillatorType = 'sine',
  volume = 0.07,
  delay = 0
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Ignore audio errors on restricted browsers
  }
}

export function playRotateSound(enabled: boolean, clockwise: boolean): void {
  if (!enabled) return;
  playTone(clockwise ? 480 : 400, 0.045, 'triangle', 0.055);
}

export function playUndoSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(340, 0.045, 'sine', 0.05);
}

export function playPinSound(enabled: boolean, pinned: boolean): void {
  if (!enabled) return;
  playTone(pinned ? 680 : 420, 0.045, 'sine', 0.05);
}

export function playBlockedSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(175, 0.08, 'sawtooth', 0.035);
}

export function playWinChime(enabled: boolean): void {
  if (!enabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    playTone(freq, 0.22, 'triangle', 0.085, idx * 0.085);
  });
}

export function playDecodeTapSound(enabled: boolean, index: number): void {
  if (!enabled) return;
  playTone(360 + index * 38, 0.045, 'sine', 0.05);
}

export function playDecodeSubmitSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(440, 0.06, 'triangle', 0.05, 0);
  playTone(587.33, 0.08, 'triangle', 0.055, 0.055);
}

export function playDecodeHintSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(740, 0.09, 'sine', 0.06);
}

export function playDecodeFailSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(260, 0.14, 'sawtooth', 0.045, 0);
  playTone(196, 0.22, 'sawtooth', 0.045, 0.12);
}
