/* Maya — the overlay of illusions: flying aksharas, mandala sparks,
   and the photosensitive image blocks (hue-shifted, inverted, pixel-torn
   windows into the cosmos). Flash rates depend on the chosen intensity:
   gentle → none, cosmic → slow soft fades only, transcendent → strobe. */
(function () {
  const Maya = {
    mode: 'cosmic', calm: false, parts: [], accent: [255, 207, 107],

    init(canvas, blockLayer, strobe) {
      this.c = canvas; this.x = canvas.getContext('2d'); this.layer = blockLayer; this.strobeEl = strobe;
      this.resize(); addEventListener('resize', () => this.resize());
      this.pool = [];
      for (let i = 0; i < 26; i++) { const d = document.createElement('div'); d.className = 'block'; blockLayer.appendChild(d); this.pool.push({ el: d, until: 0 }); }
      this.nextBlock = 0; this.strobeUntil = 0; this.strobeOn = false; this.burstLeft = 0; this.burstNext = 0;
    },
    resize() {
      this.dpr = Math.min(devicePixelRatio || 1, 1.5);
      this.c.width = innerWidth * this.dpr; this.c.height = innerHeight * this.dpr;
      this.x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },
    setMode(m) { this.mode = m; if (m === 'gentle') this.clearBlocks(); },
    setCalm(c) { this.calm = c; if (c) { this.clearBlocks(); this.strobeEl.style.opacity = 0; this.burstLeft = 0; } },
    get level() { return this.calm ? 0 : { gentle: 0, cosmic: 1, transcendent: 2 }[this.mode]; },

    clearBlocks() { this.pool && this.pool.forEach(b => { b.el.style.transition = 'opacity .3s'; b.el.style.opacity = 0; b.until = 0; }); },

    // scatter the syllables of the verse into space
    glyphs(text, n = 60) {
      const segs = [...(window.Intl && Intl.Segmenter ? new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(text) : text)]
        .map(s => s.segment || s).filter(s => s.trim() && !/[।॥\d.]/.test(s));
      if (!segs.length) return;
      const cx = innerWidth / 2, cy = innerHeight / 2;
      const count = this.calm || this.mode === 'gentle' ? n / 3 : n;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 140;
        this.parts.push({ kind: 'g', ch: segs[Math.floor(Math.random() * segs.length)], x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r,
          vx: Math.cos(a) * (0.4 + Math.random() * 1.6), vy: Math.sin(a) * (0.4 + Math.random() * 1.6), spin: (Math.random() - .5) * .02,
          rot: 0, life: 0, max: 4 + Math.random() * 5, size: 14 + Math.random() * 38, hue: Math.random() * 360 });
      }
    },
    // radiant burst of sparks — for epic verses and chapter openings
    burst(n = 220, speed = 6) {
      const cx = innerWidth / 2, cy = innerHeight / 2;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random());
        this.parts.push({ kind: 's', x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 1.5 + Math.random() * 2.5, size: 1 + Math.random() * 2.5, hue: Math.random() * 360 });
      }
    },
    // a short strobe burst (only in transcendent)
    strobe(flashes = 4) {
      if (this.level < 2) return;
      this.burstLeft = flashes * 2; this.burstNext = 0;
    },
    flashSoft() {
      if (this.level < 1) return;
      const el = this.strobeEl;
      el.style.transition = 'none'; el.style.background = '#fff'; el.style.mixBlendMode = 'soft-light'; el.style.opacity = .55;
      requestAnimationFrame(() => { el.style.transition = 'opacity 1.6s ease-out'; el.style.opacity = 0; });
    },

    spawnBlock(now, hard) {
      const b = this.pool.find(p => p.until < now); if (!b) return;
      const W = innerWidth, H = innerHeight;
      const grid = hard ? 8 : 5;
      const cw = W / grid, ch = H / grid;
      const w = cw * (1 + Math.floor(Math.random() * (hard ? 3 : 2))), h = ch * (1 + Math.floor(Math.random() * (hard ? 3 : 2)));
      const x = Math.floor(Math.random() * grid) * cw, y = Math.floor(Math.random() * grid) * ch;
      const fx = [
        `hue-rotate(${60 + Math.random() * 240 | 0}deg) saturate(2.5)`,
        `invert(1) hue-rotate(${Math.random() * 360 | 0}deg)`,
        `saturate(4) contrast(1.6) brightness(1.3)`,
        `hue-rotate(180deg) blur(6px) saturate(3)`,
        `contrast(3) saturate(0) brightness(1.4)`,
      ];
      const s = b.el.style;
      s.left = x + 'px'; s.top = y + 'px'; s.width = w + 'px'; s.height = h + 'px';
      s.backdropFilter = s.webkitBackdropFilter = fx[Math.floor(Math.random() * fx.length)];
      const tint = Math.random() < (hard ? .5 : .3);
      s.background = tint ? `hsla(${Math.random() * 360 | 0},100%,60%,${hard ? .55 : .14})` : 'transparent';
      s.mixBlendMode = tint ? (hard ? 'difference' : 'color-dodge') : 'normal';
      s.border = Math.random() < .3 ? `1px solid hsla(${Math.random() * 360 | 0},100%,70%,.6)` : '0';
      const life = hard ? 60 + Math.random() * 180 : 1600 + Math.random() * 2600;
      if (hard) { s.transition = 'none'; s.opacity = 1; }
      else { s.transition = `opacity ${life / 2000}s ease-in-out`; s.opacity = 0; requestAnimationFrame(() => { s.opacity = .9; }); setTimeout(() => { s.opacity = 0; }, life / 2); }
      b.until = now + life + (hard ? 0 : 800);
      if (hard) setTimeout(() => { s.opacity = 0; }, life);
    },

    frame(now, dt, beat, vis) {
      const L = this.level;
      // image blocks
      if (L > 0 && now > this.nextBlock) {
        const hard = L === 2;
        const n = hard ? 1 + Math.floor(Math.random() * (2 + vis * 4)) : 1;
        for (let i = 0; i < n; i++) this.spawnBlock(now, hard);
        this.nextBlock = now + (hard ? 90 + Math.random() * (260 - vis * 160) : 900 + Math.random() * 1800 - vis * 500);
      }
      // strobe sequencer (transcendent)
      if (this.burstLeft > 0 && now > this.burstNext && L === 2) {
        const el = this.strobeEl; el.style.transition = 'none';
        this.strobeOn = !this.strobeOn;
        el.style.mixBlendMode = Math.random() < .5 ? 'difference' : 'exclusion';
        el.style.background = this.strobeOn ? `hsl(${Math.random() * 360 | 0},100%,${50 + Math.random() * 50 | 0}%)` : '#fff';
        el.style.opacity = this.strobeOn ? 1 : 0;
        this.burstLeft--; this.burstNext = now + 55 + Math.random() * 40;
        if (this.burstLeft === 0) el.style.opacity = 0;
      }

      // particles
      const x = this.x, W = innerWidth, H = innerHeight;
      x.clearRect(0, 0, W, H);
      x.globalCompositeOperation = 'lighter';
      const k = dt * 60;
      const cx = W / 2, cy = H / 2;
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.life += dt;
        if (p.life > p.max) { this.parts.splice(i, 1); continue; }
        // gentle vortex
        const dx = p.x - cx, dy = p.y - cy;
        p.vx += (-dy * 0.00025) * k; p.vy += (dx * 0.00025) * k;
        p.x += p.vx * k * (1 + beat); p.y += p.vy * k * (1 + beat);
        const a = Math.sin(Math.PI * p.life / p.max);
        if (p.kind === 'g') {
          p.rot += p.spin * k;
          x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
          x.font = `${p.size}px "Tiro Devanagari Sanskrit", serif`;
          x.fillStyle = `hsla(${(p.hue + now * 0.03) % 360},100%,72%,${a * 0.75})`;
          x.shadowColor = x.fillStyle; x.shadowBlur = 18;
          x.fillText(p.ch, 0, 0); x.restore();
        } else {
          p.vx *= 0.985; p.vy *= 0.985;
          x.fillStyle = `hsla(${(p.hue + now * 0.05) % 360},100%,70%,${a})`;
          x.beginPath(); x.arc(p.x, p.y, p.size * (1 + vis), 0, 6.283); x.fill();
        }
      }
      if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900);
    },
  };
  window.Maya = Maya;
})();
