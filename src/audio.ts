let audioCtx: AudioContext | null = null;
let sfxGainNode: GainNode | null = null;
let currentVolume = 0.25;
let dayAudio: HTMLAudioElement | null = null;
let nightAudio: HTMLAudioElement | null = null;
let isMusicPlaying = false;
let isDay = true;

export function initAudio(): void {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx = new AudioContextClass();

  sfxGainNode = audioCtx.createGain();
  sfxGainNode.gain.value = currentVolume * 1.2;
  sfxGainNode.connect(audioCtx.destination);

  dayAudio = new Audio('audio/day.mp3');
  dayAudio.loop = true;
  dayAudio.volume = currentVolume;

  nightAudio = new Audio('audio/night.mp3');
  nightAudio.loop = true;
  nightAudio.volume = currentVolume;
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
  if (sfxGainNode) sfxGainNode.gain.value = currentVolume * 1.2;
  if (dayAudio) dayAudio.volume = currentVolume;
  if (nightAudio) nightAudio.volume = currentVolume;
}

export function setDayNightMusic(day: boolean): void {
    isDay = day;
    if (isMusicPlaying) {
        if (isDay) {
            nightAudio?.pause();
            dayAudio?.play().catch(e => console.log("Audio play error", e));
        } else {
            dayAudio?.pause();
            nightAudio?.play().catch(e => console.log("Audio play error", e));
        }
    }
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


export function toggleMusic(forceState?: boolean): boolean {
  ensureAudioReady();
  const targetState = forceState !== undefined ? forceState : !isMusicPlaying;

  if (targetState === isMusicPlaying) return isMusicPlaying;
  isMusicPlaying = targetState;

  if (isMusicPlaying) {
    if (isDay) {
        dayAudio?.play().catch(e => console.log(e));
    } else {
        nightAudio?.play().catch(e => console.log(e));
    }
  } else {
    dayAudio?.pause();
    nightAudio?.pause();
  }

  return isMusicPlaying;
}

export function getIsMusicPlaying(): boolean {
  return isMusicPlaying;
}
