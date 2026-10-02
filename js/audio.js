let audioCtx;
let mainGain;
let isPlaying = false;
let currentOsc = null;

// Chiptune melody notes (pentatonic scale C majorish)
const melody = [
    261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66,
    329.63, 392.00, 329.63, 261.63, 196.00, 261.63
];
let noteIndex = 0;
let nextNoteTime = 0;
let loopTimeout = null;

let bgMusicAudioElement = null;
let usingFallback = false;

export function initAudio() {
    if (audioCtx) return;
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    mainGain = audioCtx.createGain();
    
    // Load saved volume
    let savedVol = localStorage.getItem('zoro_volume');
    if (savedVol !== null) {
        mainGain.gain.value = parseFloat(savedVol);
        document.getElementById('volume-slider').value = savedVol;
    } else {
        mainGain.gain.value = 0.25;
    }
    
    mainGain.connect(audioCtx.destination);
    
    // Try to load mp3 first
    bgMusicAudioElement = new Audio('assets/audio/theme.mp3');
    bgMusicAudioElement.loop = true;
    bgMusicAudioElement.volume = mainGain.gain.value;
    
    bgMusicAudioElement.addEventListener('error', () => {
        console.log('theme.mp3 not found, falling back to procedural chiptune');
        usingFallback = true;
    });

    // Handle tab visibility
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (isPlaying) {
                if (!usingFallback) bgMusicAudioElement.pause();
                else stopFallback();
            }
        } else {
            if (isPlaying) {
                if (!usingFallback) bgMusicAudioElement.play().catch(e=>console.log(e));
                else startFallback();
            }
        }
    });
}

export function toggleMusic(forcePlay) {
    if (!audioCtx) initAudio();
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    isPlaying = forcePlay !== undefined ? forcePlay : !isPlaying;
    
    if (isPlaying) {
        if (!usingFallback) {
            bgMusicAudioElement.play().catch(() => {
                usingFallback = true;
                startFallback();
            });
        } else {
            startFallback();
        }
    } else {
        if (!usingFallback) {
            bgMusicAudioElement.pause();
        } else {
            stopFallback();
        }
    }
}

export function setVolume(val) {
    if (mainGain) {
        mainGain.gain.value = val;
    }
    if (bgMusicAudioElement) {
        bgMusicAudioElement.volume = val;
    }
    try {
        localStorage.setItem('zoro_volume', val);
    } catch(e) {}
}

function startFallback() {
    if (loopTimeout) return;
    noteIndex = 0;
    nextNoteTime = audioCtx.currentTime + 0.1;
    scheduleNote();
}

function stopFallback() {
    clearTimeout(loopTimeout);
    loopTimeout = null;
}

function scheduleNote() {
    if (!isPlaying || !usingFallback) return;
    
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        playTone(melody[noteIndex], nextNoteTime, 0.2);
        nextNoteTime += 0.25; // 100 BPM approx (16th notes)
        noteIndex = (noteIndex + 1) % melody.length;
    }
    loopTimeout = setTimeout(scheduleNote, 50);
}

function playTone(freq, time, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);
    
    osc.connect(gain);
    gain.connect(mainGain);
    
    osc.start(time);
    osc.stop(time + duration);
}

export function playClickSound() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(mainGain);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}
