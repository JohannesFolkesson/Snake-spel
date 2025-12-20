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

export async function tryPlayExternalFail() {
  const url = failTrackUrl || './assets/mario_fail.mp3';
  try {
    if (!cachedFailAudio) cachedFailAudio = new Audio(url);
    // Attempt to play via HTMLAudioElement (handles compressed files easily)
    await cachedFailAudio.play();
    return true;
  } catch (e) {
    console.warn('External fail audio not available or blocked:', e);
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
    } else if (type === 'eat') {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(900, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.25, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.12);
    }
  } catch (e) {
    console.warn('Sound play failed', e);
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
      { f: 196, d: 0.36 }, // G3
      { f: 174, d: 0.5  }, // F3
      { f: 155, d: 0.9  }  // D#3 (resolve)
    ];

    // create a lowpass filter for the motif to keep things dark
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

      // mild distortion to add grit
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
