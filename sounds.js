let audioCtx = null;
export function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Optional external fail track (e.g. your licensed "Mario" sound).
let failTrackUrl = null;
let cachedFailAudio = null;

export function setFailTrack(url) {
  failTrackUrl = url;
  cachedFailAudio = null;
}

// Optional external start track (e.g. background/start music when the game begins)
let startTrackUrl = null;
let cachedStartAudio = null;

export function setStartTrack(url) {
  startTrackUrl = url;
  cachedStartAudio = null;
} 

// Optional external eat track (user-provided chomp sound)
let eatTrackUrl = null;
let cachedEatAudio = null;

export function setEatTrack(url) {
  eatTrackUrl = url;
  cachedEatAudio = null;
} 

// Helper: check if the browser can play a given mime type
function canPlayMime(mime) {
  try {
    const a = new Audio();
    return !!(a.canPlayType && a.canPlayType(mime));
  } catch (e) {
    return false;
  }
}

// Short synthesized start tone fallback (used when MP3 missing/unsupported)
export function playStartTone() {
  try {
    ensureAudio();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(440, t);
    o.frequency.exponentialRampToValueAtTime(660, t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t); o.stop(t + 0.5);
  } catch (e) {
    console.warn('Start tone failed', e);
  }
} 

export async function tryPlayExternalFail() {
  const url = failTrackUrl || './assets/mario_fail.mp3';
  try {
    // Quick compatibility check: if browser cannot play MP3, skip attempt
    if (!canPlayMime('audio/mpeg')) {
      console.warn('MP3 not supported by this browser (fail track).');
      return false;
    }
    if (!cachedFailAudio) {
      cachedFailAudio = new Audio(url);
      cachedFailAudio.preload = 'auto';
      cachedFailAudio.addEventListener('error', (ev) => {
        console.warn('Fail audio load error', ev);
        cachedFailAudio = null;
      });
    }
    // Attempt to play via HTMLAudioElement
    await cachedFailAudio.play();
    return true;
  } catch (e) {
    console.warn('External fail audio not available or blocked:', e);
    cachedFailAudio = null;
    return false;
  }
}

export async function tryPlayExternalEat() {
  const url = eatTrackUrl || './assets/eat.mp3';
  try {
    if (!canPlayMime('audio/mpeg')) {
      console.warn('MP3 not supported by this browser (eat track).');
      return false;
    }
    if (!cachedEatAudio) {
      cachedEatAudio = new Audio(url);
      cachedEatAudio.preload = 'auto';
      cachedEatAudio.addEventListener('error', (ev) => {
        console.warn('Eat audio load error', ev);
        cachedEatAudio = null;
      });
    }
    await cachedEatAudio.play();
    return true;
  } catch (e) {
    console.warn('External eat audio not available or blocked:', e);
    cachedEatAudio = null;
    return false;
  }
}  

export async function playSound(type) {
  try {
    ensureAudio();
    const now = audioCtx.currentTime;
    if (type === 'death') {
      // Try external licensed track first; fallback to synth if it fails
      const ok = await tryPlayExternalFail();
      if (ok) return;
      // Play a short chiptune-style "game over" jingle (original composition)
      playGameOverJingle();
    } else if (type === 'start') {
      // Play an external start MP3 if available, otherwise fall back to a short synth tone
      const url = startTrackUrl || './assets/start.mp3';
      try {
        if (!canPlayMime('audio/mpeg')) {
          console.warn('MP3 not supported by this browser (start track). Using fallback tone.');
          playStartTone();
          return;
        }
        if (!cachedStartAudio) {
          cachedStartAudio = new Audio(url);
          cachedStartAudio.preload = 'auto';
          cachedStartAudio.addEventListener('error', (ev) => {
            console.warn('Start audio load error', ev);
            cachedStartAudio = null;
          });
        }
        await cachedStartAudio.play();
      } catch (e) {
        console.warn('Start audio not available or blocked:', e);
        // fallback to synth so user hears a sound
        playStartTone();
      }
    } else if (type === 'eat') {
      // Try external eat audio first; if unavailable, use synth fallback
      const ok = await tryPlayExternalEat();
      if (ok) return;

      // Chomp/eat sound: short filtered noise burst + a quick bite tone + tiny click
      const duration = 0.12;

      // Short noise 'crunch' burst
      const noiseBuffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * duration), audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        // Decaying noise envelope baked into the buffer for natural feel
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const nb = audioCtx.createBufferSource();
      nb.buffer = noiseBuffer;
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseFilter.Q.setValueAtTime(1.2, now);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.006);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      nb.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(audioCtx.destination);
      nb.start(now); nb.stop(now + duration);

      // Short tonal 'bite' to give pitch perception of eating
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(920, now);
      o.frequency.exponentialRampToValueAtTime(720, now + duration);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + duration);

      // Tiny click for sharpness
      const click = audioCtx.createOscillator();
      const clickG = audioCtx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(2600, now);
      clickG.gain.setValueAtTime(0.0001, now);
      clickG.gain.linearRampToValueAtTime(0.08, now + 0.002);
      clickG.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      click.connect(clickG); clickG.connect(audioCtx.destination);
      click.start(now); click.stop(now + 0.03);
    }
  } catch (e) {
    console.warn('Sound play failed', e);
  }
}

// Helper: play sounds based on host state sync changes (used by clients)
export function handleStateSyncForSound(prevFood, prevScore, snapshot, isHost) {
  try {
    if (!isHost) {
      const foodChanged = prevFood && (!snapshot.food || snapshot.food.x !== prevFood.x || snapshot.food.y !== prevFood.y);
      const scoreIncreased = (typeof snapshot.score === 'number') && snapshot.score > prevScore;
      if (foodChanged || scoreIncreased) {
        try { playSound('eat'); } catch (e) { /* ignore */ }
      }
    }
  } catch (e) {
    console.warn('State sound handling failed', e);
  }
}

// Original chiptune-like game over jingle (not a copy of any copyrighted theme)
export function playGameOverJingle() {
  try {
    ensureAudio();
    const t0 = audioCtx.currentTime;

    // Low sub thump for impact
    const sub = audioCtx.createOscillator();
    const subG = audioCtx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40, t0); // lower sub for darker feel
    subG.gain.setValueAtTime(0.0001, t0);
    subG.gain.linearRampToValueAtTime(0.9, t0 + 0.02);
    subG.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
    // mild lowpass to make it thumpy
    const subFilter = audioCtx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(200, t0);
    sub.connect(subFilter); subFilter.connect(subG); subG.connect(audioCtx.destination);
    sub.start(t0); sub.stop(t0 + 1.2);

    const notes = [
      { f: 220, d: 0.36 },
      { f: 196, d: 0.36 },
      { f: 174, d: 0.5  },
      { f: 155, d: 0.9  }
    ];


    const motifFilter = audioCtx.createBiquadFilter();
    motifFilter.type = 'lowpass';
    motifFilter.frequency.setValueAtTime(900, t0 + 0.06);
    motifFilter.Q.setValueAtTime(1.2, t0 + 0.06);

    let t = t0 + 0.08;
    for (const n of notes) {
      const oA = audioCtx.createOscillator();
      const oB = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      oA.type = 'triangle';
      oB.type = 'sawtooth';
      // heavier detune
      oA.frequency.setValueAtTime(n.f * 0.997, t);
      oB.frequency.setValueAtTime(n.f * 1.008, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.45, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.d + 0.03);

      const shaper = audioCtx.createWaveShaper();
      function makeDistortion(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
          const x = (i * 2) / n_samples - 1;
          curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
      }
      shaper.curve = makeDistortion(20);
      shaper.oversample = '2x';

      oA.connect(shaper); oB.connect(shaper); shaper.connect(g); g.connect(motifFilter);
      motifFilter.connect(audioCtx.destination);

      oA.start(t); oB.start(t); oA.stop(t + n.d + 0.04); oB.stop(t + n.d + 0.04);
      t += n.d;
    }

    // Low dark pad sustain to finish with slow filter sweep
    const pad = audioCtx.createOscillator();
    const padG = audioCtx.createGain();
    const padFilter = audioCtx.createBiquadFilter();
    pad.type = 'sawtooth';
    pad.frequency.setValueAtTime(55, t);
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(800, t);
    padFilter.Q.setValueAtTime(0.7, t);
    padG.gain.setValueAtTime(0.0001, t);
    padG.gain.linearRampToValueAtTime(0.18, t + 0.04);
    padG.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
    // sweep down the filter to darken over time
    padFilter.frequency.linearRampToValueAtTime(200, t + 1.8);
    pad.connect(padFilter); padFilter.connect(padG); padG.connect(audioCtx.destination);
    pad.start(t); pad.stop(t + 2.0);
  } catch (e) {
    console.warn('Game over jingle failed', e);
  }
}