/* Nada — the cosmic sound engine. Everything is synthesised live:
   an Om drone tuned to 136.1 Hz (the "cosmic Om"), a tanpura cycle,
   theta-wave binaural shimmer, solar wind, singing bowls between verses,
   a conch for every chapter, Krishna's bansuri, and the roaring choir of the Vishwaroop. */
(function () {
  const SA = 136.1;
  const Nada = {
    ctx: null, started: false, muted: false, volume: 0.7,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = 0;
      this.duck = ctx.createGain(); this.duck.gain.value = 1;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.02; comp.release.value = 0.4;
      this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512; this.analyser.smoothingTimeConstant = 0.6;
      this.fft = new Uint8Array(this.analyser.frequencyBinCount);
      this.duck.connect(this.master); this.master.connect(comp); comp.connect(this.analyser); this.analyser.connect(ctx.destination);

      this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(6.5, 2.6);
      this.verbGain = ctx.createGain(); this.verbGain.gain.value = 0.55;
      this.verb.connect(this.verbGain); this.verbGain.connect(this.duck);
      this.dry = ctx.createGain(); this.dry.gain.value = 0.8; this.dry.connect(this.duck);
      this.bus = ctx.createGain(); this.bus.connect(this.dry); this.bus.connect(this.verb);

      this.noise = this.noiseBuffer(4);
      this.buildDrone(); this.buildWind(); this.buildBinaural(); this.buildVishwa();
      this.tanpuraBufs = [SA * 0.75, SA, SA, SA / 2].map(f => this.pluck(f, 3.2));
    },

    start() {
      this.init(); if (!this.ctx) return;
      this.ctx.resume();
      if (this.started) return;
      this.started = true;
      const t = this.ctx.currentTime;
      this.master.gain.setValueAtTime(0, t);
      this.master.gain.linearRampToValueAtTime(this.muted ? 0 : this.volume, t + 5);
      this.tanpuraLoop();
      this.flutePhrase(4);
    },

    setVolume(v) { this.volume = v; if (this.ctx && !this.muted) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2); },
    setMuted(m) { this.muted = m; if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.3); },
    speaking(on) { if (this.ctx) this.duck.gain.setTargetAtTime(on ? 0.55 : 1, this.ctx.currentTime, 0.5); },

    impulse(sec, decay) {
      const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
      return b;
    },
    noiseBuffer(sec) {
      const ctx = this.ctx, len = ctx.sampleRate * sec, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // brown-ish
      return b;
    },
    // Karplus–Strong string, pre-rendered: the jawari buzz of a tanpura
    pluck(freq, sec) {
      const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * sec), b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0);
      const N = Math.round(sr / freq); const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = Math.random() * 2 - 1;
      let idx = 0;
      for (let i = 0; i < len; i++) {
        const nx = (idx + 1) % N;
        const v = 0.4985 * (buf[idx] + buf[nx]);
        buf[idx] = v + 0.0025 * Math.sign(v) * Math.random(); // jawari shimmer
        d[i] = v * (i < 200 ? i / 200 : 1); idx = nx;
      }
      return b;
    },

    buildDrone() {
      const ctx = this.ctx;
      const out = ctx.createGain(); out.gain.value = 0.16;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 3;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
      const lfoG = ctx.createGain(); lfoG.gain.value = 420; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      [[SA / 2, 'sine', .9], [SA, 'sawtooth', .22], [SA * 1.002, 'sawtooth', .22], [SA * 1.5, 'triangle', .25], [SA * 2, 'sine', .3], [SA * 3, 'sine', .08]].forEach(([f, type, g]) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
        const gg = ctx.createGain(); gg.gain.value = g;
        o.connect(gg); gg.connect(lp); o.start();
      });
      // "Om" formant: a vowel slowly moving from a → u → m
      const form = ctx.createBiquadFilter(); form.type = 'bandpass'; form.Q.value = 6; form.frequency.value = 700;
      const fl = ctx.createOscillator(); fl.frequency.value = 0.07; const fg = ctx.createGain(); fg.gain.value = 350;
      fl.connect(fg); fg.connect(form.frequency); fl.start();
      lp.connect(out); lp.connect(form); const fo = ctx.createGain(); fo.gain.value = 0.9; form.connect(fo); fo.connect(out);
      out.connect(this.bus);
      this.droneOut = out; this.droneLP = lp;
    },
    buildWind() {
      const ctx = this.ctx;
      const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 1.2;
      const l = ctx.createOscillator(); l.frequency.value = 0.03; const lg = ctx.createGain(); lg.gain.value = 380; l.connect(lg); lg.connect(bp.frequency); l.start();
      const g = ctx.createGain(); g.gain.value = 0.06;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      src.connect(bp); bp.connect(g);
      if (pan) { const pl = ctx.createOscillator(); pl.frequency.value = 0.04; pl.connect(pan.pan); pl.start(); g.connect(pan); pan.connect(this.bus); } else g.connect(this.bus);
      src.start(); this.wind = g;
    },
    buildBinaural() {
      const ctx = this.ctx;
      const merger = ctx.createChannelMerger(2);
      const g = ctx.createGain(); g.gain.value = 0.05;
      [[SA * 2, 0], [SA * 2 + 6, 1]].forEach(([f, ch]) => { // 6 Hz theta beat
        const o = ctx.createOscillator(); o.frequency.value = f; o.start(); o.connect(merger, 0, ch);
      });
      merger.connect(g); g.connect(this.duck); this.binaural = g;
    },
    buildVishwa() {
      const ctx = this.ctx;
      const g = ctx.createGain(); g.gain.value = 0; this.vishwaG = g;
      // choir of the cosmos: detuned saws through vowel formants
      const choir = ctx.createGain(); choir.gain.value = 0.12;
      [1, 1.5, 2, 2.5, 3, 4].forEach((m, i) => [-7, 0, 7].forEach(dt => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = SA / 2 * m; o.detune.value = dt + i; o.start(); o.connect(choir);
      }));
      const out = ctx.createGain(); out.gain.value = 1;
      [[800, 8], [1150, 10], [2900, 12]].forEach(([f, q]) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; choir.connect(b); b.connect(out); });
      // earth-shaking rumble
      const rs = ctx.createBufferSource(); rs.buffer = this.noise; rs.loop = true;
      const rl = ctx.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 90;
      const rg = ctx.createGain(); rg.gain.value = 0.9; rs.connect(rl); rl.connect(rg); rg.connect(out); rs.start();
      // shimmering high partials, like a thousand suns
      const sh = ctx.createGain(); sh.gain.value = 0.02;
      [SA * 8, SA * 10, SA * 12, SA * 15, SA * 16].forEach((f, i) => {
        const o = ctx.createOscillator(); o.frequency.value = f; const t = ctx.createGain(); t.gain.value = 0;
        const l = ctx.createOscillator(); l.frequency.value = 0.3 + i * 0.17; const lg = ctx.createGain(); lg.gain.value = 1;
        l.connect(lg); lg.connect(t.gain); o.connect(t); t.connect(sh); o.start(); l.start();
      });
      sh.connect(out);
      out.connect(g); g.connect(this.bus);
      // kāla: dark sub drone
      const kg = ctx.createGain(); kg.gain.value = 0; this.kalaG = kg;
      [SA / 4, SA / 4 * 1.06].forEach(f => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.start(); o.connect(kg); });
      const kl = ctx.createBiquadFilter(); kl.type = 'lowpass'; kl.frequency.value = 220; kg.connect(kl); kl.connect(this.bus);
    },

    setScene({ vis = 0, kala = 0, speaker = 'K' }) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.vishwaG.gain.setTargetAtTime(vis * 0.9, t, 2.2);
      this.kalaG.gain.setTargetAtTime(kala * 0.25, t, 1.5);
      this.droneLP.frequency.setTargetAtTime(speaker === 'A' ? 450 : speaker === 'K' ? 900 : 600, t, 2);
      this.wind.gain.setTargetAtTime(0.05 + vis * 0.08 + kala * 0.1, t, 2);
      this.speaker = speaker;
    },

    tanpuraLoop() {
      const ctx = this.ctx; let i = 0;
      const step = () => {
        if (!this.ctx) return;
        const s = ctx.createBufferSource(); s.buffer = this.tanpuraBufs[i % 4];
        const g = ctx.createGain(); g.gain.value = i % 4 === 3 ? 0.18 : 0.12;
        const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        s.connect(g); if (p) { p.pan.value = [-.3, .1, .3, -.1][i % 4]; g.connect(p); p.connect(this.bus); } else g.connect(this.bus);
        s.start(); i++;
        setTimeout(step, i % 4 === 0 ? 1900 : 1050);
      };
      step();
    },

    // a singing bowl rings between verses
    bowl(pitch = 1, gain = 0.18) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime, f0 = SA * 2 * pitch;
      [[1, 1], [2.76, .5], [5.4, .25], [8.93, .12]].forEach(([m, a], i) => {
        const o = ctx.createOscillator(); o.frequency.value = f0 * m;
        const o2 = ctx.createOscillator(); o2.frequency.value = f0 * m + 1.3 + i;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain * a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 7 - i);
        o.connect(g); o2.connect(g); g.connect(this.bus); o.start(t); o2.start(t); o.stop(t + 8); o2.stop(t + 8);
      });
    },

    // Panchajanya — the conch that opens every chapter
    conch() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(SA * 1.4, t); o.frequency.exponentialRampToValueAtTime(SA * 1.5, t + 0.6);
      o.frequency.setValueAtTime(SA * 1.5, t + 2.6); o.frequency.exponentialRampToValueAtTime(SA * 1.2, t + 3.6);
      const vib = ctx.createOscillator(); vib.frequency.value = 5.5; const vg = ctx.createGain(); vg.gain.value = 3; vib.connect(vg); vg.connect(o.frequency);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.5); g.gain.setValueAtTime(0.22, t + 2.6); g.gain.linearRampToValueAtTime(0, t + 3.8);
      const out = ctx.createGain(); out.gain.value = 1;
      [[450, 4], [1100, 6], [2400, 8]].forEach(([f, q]) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; o.connect(b); b.connect(g); });
      const br = ctx.createBufferSource(); br.buffer = this.noise; const bh = ctx.createBiquadFilter(); bh.type = 'highpass'; bh.frequency.value = 1500; const bg = ctx.createGain(); bg.gain.value = 0.15;
      br.connect(bh); bh.connect(bg); bg.connect(g);
      g.connect(out); out.connect(this.bus);
      o.start(t); vib.start(t); br.start(t); o.stop(t + 4); vib.stop(t + 4); br.stop(t + 4);
    },

    // swoosh through hyperspace
    whoosh(len = 2.2) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const s = ctx.createBufferSource(); s.buffer = this.noise;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
      f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(4000, t + len * 0.7); f.frequency.exponentialRampToValueAtTime(300, t + len);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + len * 0.6); g.gain.linearRampToValueAtTime(0, t + len);
      s.connect(f); f.connect(g); g.connect(this.bus); s.start(t); s.stop(t + len + 0.1);
    },

    // a deep cosmic boom for epic verses
    boom() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(28, t + 2.5);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 3.6);
      this.bowl(0.5, 0.25);
    },

    // Krishna's bansuri — a soft pentatonic phrase in Raga Bhupali
    flutePhrase(delay = 0) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2];
      let t = ctx.currentTime + delay;
      let idx = 3 + Math.floor(Math.random() * 3);
      const notes = 4 + Math.floor(Math.random() * 4);
      for (let n = 0; n < notes; n++) {
        idx = Math.max(0, Math.min(scale.length - 1, idx + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
        const dur = [0.5, 0.8, 1.2, 1.8][Math.floor(Math.random() * 4)] + (n === notes - 1 ? 1.5 : 0);
        const f = SA * 4 * scale[idx];
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
        const v = ctx.createOscillator(); v.frequency.value = 5; const vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + dur * 0.8); v.connect(vg); vg.connect(o.frequency);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.08); g.gain.setValueAtTime(0.06, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
        const br = ctx.createBufferSource(); br.buffer = this.noise; const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 3; const bg = ctx.createGain(); bg.gain.value = 0.05;
        br.connect(bf); bf.connect(bg); bg.connect(g);
        o.connect(g); g.connect(this.bus);
        o.start(t); v.start(t); br.start(t); o.stop(t + dur + 0.05); v.stop(t + dur + 0.05); br.stop(t + dur + 0.05);
        t += dur * 0.92;
      }
    },

    level() {
      if (!this.analyser) return 0;
      this.analyser.getByteFrequencyData(this.fft);
      let s = 0; for (let i = 1; i < 24; i++) s += this.fft[i];
      return s / (23 * 255);
    },
  };
  window.Nada = Nada;
})();
