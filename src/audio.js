// Procedural cyberpunk soundtrack + UI sounds. No audio files: everything is synthesised with WebAudio,
// so there is nothing to license or host. Browsers only allow audio after a user gesture, so it starts
// when the visitor presses the Sound button.
//
//   const sound = createSound();  sound.toggle();  sound.hover();  sound.click();

const BPM = 96;
const STEP = 60 / BPM / 4; // 16th note
// Am – F – C – G, one bar each (MIDI roots)
const BARS = [
  { root: 45, chord: [57, 60, 64, 67] },
  { root: 41, chord: [53, 57, 60, 64] },
  { root: 48, chord: [55, 60, 64, 67] },
  { root: 43, chord: [55, 59, 62, 67] },
];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// hard-clipping curve for the spark's distortion
let _crush;
const crush = () => {
  if (_crush) return _crush;
  _crush = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; _crush[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.35); }
  return _crush;
};

export function createSound() {
  let ctx = null, master, music, sfx, noise, delay;
  let on = false, step = 0, nextT = 0, timer = 0;
  const listeners = new Set();

  function boot() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.55; music.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(master);

    // feedback delay for width on the arp/pad
    delay = ctx.createDelay(1); delay.delayTime.value = STEP * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2400;
    delay.connect(dl).connect(fb).connect(delay);
    dl.connect(music);

    const len = ctx.sampleRate;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  const env = (g, t, a, peak, dur) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };
  function tone({ type = 'sawtooth', f, t, dur, vol, cutoff = 1200, a = 0.01, to = music, send = 0, detune = 0, sweep }) {
    const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    if (sweep) o.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(cutoff, t); fl.frequency.exponentialRampToValueAtTime(Math.max(cutoff * 0.3, 80), t + dur);
    env(g, t, a, vol, dur);
    o.connect(fl).connect(g).connect(to);
    if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(delay); }
    o.start(t); o.stop(t + dur + 0.05);
  }
  function hit({ t, dur, vol, type = 'highpass', freq = 7000, q = 0.7, to = music }) {
    const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise; fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
    env(g, t, 0.002, vol, dur);
    src.connect(fl).connect(g).connect(to);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  function schedule(s, t) {
    const bar = BARS[Math.floor(s / 16) % BARS.length], n = s % 16;
    // drums
    if (n % 8 === 0) tone({ type: 'sine', f: 150, sweep: 42, t, dur: 0.28, vol: 0.9, cutoff: 900 });
    if (n === 4 || n === 12) { hit({ t, dur: 0.16, vol: 0.34, type: 'bandpass', freq: 1800, q: 0.9 }); tone({ type: 'triangle', f: 200, sweep: 120, t, dur: 0.1, vol: 0.2, cutoff: 1500 }); }
    if (n % 2 === 0) hit({ t, dur: n % 4 === 2 ? 0.07 : 0.03, vol: n % 4 === 2 ? 0.1 : 0.06 });
    // bass: driving 8ths with an octave pop
    if (n % 2 === 0) tone({ f: hz(bar.root - (n % 8 === 6 ? 0 : 12)), t, dur: STEP * 1.8, vol: 0.3, cutoff: 520 + (n % 8 === 0 ? 500 : 0), a: 0.005 });
    // arp: 16ths through the chord, accent every fourth
    const pat = [0, 2, 1, 3, 2, 1, 3, 2];
    const note = bar.chord[pat[n % 8]] + (n % 8 > 5 ? 12 : 0);
    tone({ type: 'square', f: hz(note), t, dur: STEP * 1.4, vol: n % 4 === 0 ? 0.075 : 0.045, cutoff: 1800 + Math.sin(s / 8) * 900, send: 0.5, a: 0.004 });
    // pad: once per bar, slow attack
    if (n === 0) bar.chord.slice(0, 3).forEach((m, k) => tone({ f: hz(m - 12), t, dur: STEP * 16, vol: 0.05, cutoff: 700, a: STEP * 5, detune: k * 7 - 7, send: 0.3 }));
  }

  function pump() {
    while (nextT < ctx.currentTime + 0.25) { schedule(step, nextT); nextT += STEP; step++; }
  }

  async function start() {
    if (!ctx) boot();
    await ctx.resume();
    on = true;
    nextT = ctx.currentTime + 0.08;
    clearInterval(timer);
    timer = setInterval(pump, 60);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
  }
  function stop() {
    on = false;
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    setTimeout(() => { if (!on) { clearInterval(timer); ctx.suspend(); } }, 450);
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    if (document.hidden) { clearInterval(timer); ctx.suspend(); }
    else ctx.resume().then(() => { nextT = ctx.currentTime + 0.08; timer = setInterval(pump, 60); });
  });

  let lastHover = 0;
  return {
    get on() { return on; },
    onChange(fn) { listeners.add(fn); },
    async toggle() {
      on ? stop() : await start();
      listeners.forEach((fn) => fn(on));
      return on;
    },
    // electric arc: a bright zap whose pitch jitters wildly, plus a crackle of noise ticks
    hover() {
      if (!on || !ctx) return;
      const t = ctx.currentTime;
      if (t - lastHover < 0.06) return;
      lastHover = t;
      const o = ctx.createOscillator(), sh = ctx.createWaveShaper(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth';
      // random frequency steps every 6ms = the buzzy, unstable spark character
      o.frequency.setValueAtTime(900, t);
      for (let k = 1; k < 9; k++) o.frequency.setValueAtTime(500 + Math.random() * 2600, t + k * 0.006);
      sh.curve = crush(); sh.oversample = '2x';
      hp.type = 'highpass'; hp.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
      o.connect(sh).connect(hp).connect(g).connect(sfx);
      o.start(t); o.stop(t + 0.09);
      for (let k = 0; k < 4; k++) hit({ t: t + k * 0.014 + Math.random() * 0.008, dur: 0.012, vol: 0.09, freq: 4500 + Math.random() * 4000, to: sfx });
    },
    // low, crunchy "engage" zap
    click() {
      if (!on || !ctx) return;
      const t = ctx.currentTime;
      tone({ type: 'sawtooth', f: 520, sweep: 70, t, dur: 0.16, vol: 0.16, cutoff: 3200, a: 0.002, to: sfx });
      tone({ type: 'square', f: 1760, sweep: 880, t, dur: 0.06, vol: 0.05, cutoff: 5000, a: 0.002, to: sfx });
      hit({ t, dur: 0.07, vol: 0.12, type: 'bandpass', freq: 2500, q: 1.2, to: sfx });
    },
  };
}
