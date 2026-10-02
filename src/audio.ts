let audioCtx: AudioContext | null = null;
let musicGainNode: GainNode | null = null;
let sfxGainNode: GainNode | null = null;
let isMusicPlaying = false;
let currentVolume = 0.25;
let musicTimer: number | null = null;

export function initAudio(): void {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx = new AudioContextClass();

  musicGainNode = audioCtx.createGain();
  sfxGainNode = audioCtx.createGain();

  musicGainNode.gain.value = currentVolume;
  sfxGainNode.gain.value = currentVolume * 1.2;

  musicGainNode.connect(audioCtx.destination);
  sfxGainNode.connect(audioCtx.destination);
}

function ensureAudioReady(): boolean {
  if (!audioCtx) initAudio();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx !== null;
}

export function setVolume(val: number): void {
  currentVolume = Math.max(0, Math.min(1, val));
  if (musicGainNode) musicGainNode.gain.value = currentVolume;
  if (sfxGainNode) sfxGainNode.gain.value = currentVolume * 1.2;
}

export function playClickSound(): void {
  if (!ensureAudioReady() || !audioCtx || !sfxGainNode) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.06);

  gain.gain.setValueAtTime(sfxGainNode.gain.value * 0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.06);
}

export function playJumpSound(): void {
  if (!ensureAudioReady() || !audioCtx || !sfxGainNode) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.12);

  gain.gain.setValueAtTime(sfxGainNode.gain.value * 0.35, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.12);
}

export function playStepSound(): void {
  if (!ensureAudioReady() || !audioCtx || !sfxGainNode) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(90 + Math.random() * 30, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);

  gain.gain.setValueAtTime(sfxGainNode.gain.value * 0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

export function playChestOpenSound(): void {
  if (!ensureAudioReady() || !audioCtx || !sfxGainNode) return;
  const t = audioCtx.currentTime;

  // Low wooden creak
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(120, t);
  osc1.frequency.exponentialRampToValueAtTime(80, t + 0.15);
  gain1.gain.setValueAtTime(sfxGainNode.gain.value * 0.3, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start();
  osc1.stop(t + 0.15);

  // High magical sparkle chime
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const noteStart = t + 0.05 + idx * 0.06;

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, noteStart);
    gain.gain.setValueAtTime(sfxGainNode!.gain.value * 0.25, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(noteStart);
    osc.stop(noteStart + 0.18);
  });
}

export function playItemSwitchSound(): void {
  if (!ensureAudioReady() || !audioCtx || !sfxGainNode) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.04);

  gain.gain.setValueAtTime(sfxGainNode.gain.value * 0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.04);
}

export function playCoinSound(): void {
  if (!ensureAudioReady() || !audioCtx || !sfxGainNode) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(987.77, t); // B5
  osc.frequency.setValueAtTime(1318.51, t + 0.07); // E6

  gain.gain.setValueAtTime(sfxGainNode.gain.value * 0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(t);
  osc.stop(t + 0.22);
}

// Procedural Terraria daytime chiptune melody
const melodyNotes = [
  329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66,
  329.63, 392.00, 440.00, 587.33, 523.25, 440.00, 392.00, 329.63
];
let noteIndex = 0;

function playMelodyStep(): void {
  if (!isMusicPlaying || !audioCtx || !musicGainNode) return;

  const freq = melodyNotes[noteIndex % melodyNotes.length];
  noteIndex++;

  const osc = audioCtx.createOscillator();
  const noteGain = audioCtx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  const vol = musicGainNode.gain.value * 0.18;
  noteGain.gain.setValueAtTime(vol, audioCtx.currentTime);
  noteGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);

  osc.connect(noteGain);
  noteGain.connect(musicGainNode);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.24);

  // Bass note on every 4th step
  if (noteIndex % 4 === 0) {
    const bass = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(freq / 2, audioCtx.currentTime);
    bassGain.gain.setValueAtTime(vol * 1.2, audioCtx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    bass.connect(bassGain);
    bassGain.connect(musicGainNode);
    bass.start();
    bass.stop(audioCtx.currentTime + 0.36);
  }

  musicTimer = window.setTimeout(playMelodyStep, 260);
}

export function toggleMusic(forceState?: boolean): boolean {
  ensureAudioReady();
  const targetState = forceState !== undefined ? forceState : !isMusicPlaying;

  if (targetState === isMusicPlaying) return isMusicPlaying;
  isMusicPlaying = targetState;

  if (isMusicPlaying) {
    noteIndex = 0;
    playMelodyStep();
  } else {
    if (musicTimer !== null) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  }

  return isMusicPlaying;
}

export function getIsMusicPlaying(): boolean {
  return isMusicPlaying;
}
