(function () {
  const $ = s => document.querySelector(s);
  const body = document.body;
  const { PROLOGUE, EPILOGUE, PALETTES, ACCENTS, SPEAKERS, vishwaFor, EPIC } = window.Katha;
  const DEV = '०१२३४५६७८९';
  const toDev = s => String(s).replace(/\d/g, d => DEV[d]);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const seg = (text, lang) => window.Intl && Intl.Segmenter ? [...new Intl.Segmenter(lang, { granularity: 'grapheme' }).segment(text)].map(s => s.segment) : [...text];

  /* ---------------- settings ---------------- */
  const defaults = { mode: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'gentle' : 'cosmic', voice: 'en', rate: 0.92, vol: 0.7, vvol: 1, hindi: true, translit: true, auto: true, muted: false, calm: false };
  let S = { ...defaults };
  try { Object.assign(S, JSON.parse(localStorage.getItem('vishwaroop.settings') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('vishwaroop.settings', JSON.stringify(S)); } catch (e) {} };

  /* ---------------- data & steps ---------------- */
  let DATA, steps = [], chapStep = {}, verseStep = {};
  function buildSteps() {
    PROLOGUE.forEach((p, i) => steps.push({ t: 'pro', i }));
    let vi = 0;
    DATA.chapters.forEach(c => {
      chapStep[c.n] = steps.length;
      steps.push({ t: 'chap', ch: c.n });
      while (vi < DATA.verses.length && DATA.verses[vi][0] === c.n) { verseStep[c.n + '.' + DATA.verses[vi][1]] = steps.length; steps.push({ t: 'verse', idx: vi }); vi++; }
    });
    steps.push({ t: 'end' });
  }

  /* ---------------- voice ---------------- */
  const synth = window.speechSynthesis;
  const Voice = {
    list: [],
    load() { if (synth) this.list = synth.getVoices(); },
    pick(lang) {
      const L = this.list;
      if (lang === 'hi') return L.find(v => /hi[-_]IN/i.test(v.lang) && /google/i.test(v.name)) || L.find(v => /^hi/i.test(v.lang)) || null;
      return L.find(v => /en[-_]IN/i.test(v.lang) && /rishi|google|prabhat|ravi/i.test(v.name)) || L.find(v => /en[-_]IN/i.test(v.lang))
        || L.find(v => /en[-_]GB/i.test(v.lang) && /daniel|google uk english male/i.test(v.name)) || L.find(v => /^en/i.test(v.lang)) || null;
    },
    chunks(text) {
      const parts = text.replace(/\s+/g, ' ').split(/(?<=[.!?;:।॥])\s+/);
      const out = []; let off = 0;
      parts.forEach(p => {
        let rest = p;
        while (rest.length > 220) { let cut = rest.lastIndexOf(',', 220); if (cut < 60) cut = rest.lastIndexOf(' ', 220); out.push(rest.slice(0, cut + 1)); rest = rest.slice(cut + 1); }
        if (rest.trim()) out.push(rest);
      });
      return out.map(c => { const o = { c, off }; off += c.length; return o; });
    },
    async speak(text, lang, gen, pitch = 1, onword) {
      if (!synth || !text) return;
      const voice = this.pick(lang);
      if (!voice && lang === 'hi') toast('No Hindi voice on this device — using English');
      const flat = text.replace(/\s+/g, ' ');
      for (const { c, off } of this.chunks(flat)) {
        if (gen !== state.gen) return;
        await new Promise(res => {
          const u = new SpeechSynthesisUtterance(c);
          if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
          u.rate = S.rate; u.pitch = pitch; u.volume = S.vvol;
          const guard = setTimeout(res, 2500 + c.length * 110 / S.rate);
          u.onend = u.onerror = () => { clearTimeout(guard); res(); };
          if (onword) u.onboundary = e => { if (e.name === 'word' || e.name === undefined) onword(off + e.charIndex); };
          Nada.speaking(true);
          synth.speak(u);
        });
      }
      Nada.speaking(false);
    },
    stop() { if (synth) synth.cancel(); Nada.speaking(false); },
  };
  if (synth) { Voice.load(); synth.onvoiceschanged = () => Voice.load(); }

  /* ---------------- state ---------------- */
  const state = { i: 0, gen: 0, playing: false, started: false };

  /* ---------------- rendering ---------------- */
  const card = $('#card'), chCard = $('#chapter-card'), stCard = $('#story-card');
  function setAccent(key) { document.documentElement.style.setProperty('--accent', ACCENTS[key] || ACCENTS.K); }

  function scene({ speaker = 'K', ch = 1, vis = 0, kala = 0, sun = 0, hold = false, warp = 0.25 }) {
    const pal = kala > 0.45 ? PALETTES.KALA : PALETTES[speaker] || PALETTES.K;
    const intensity = { gentle: 0.35, cosmic: 0.78, transcendent: 1 }[S.mode];
    Cosmos.set({ c1: pal[0], c2: pal[1], c3: pal[2], int: intensity, vis, kala, chap: ch, calm: S.calm ? 1 : 0, sunHold: hold });
    if (sun) Cosmos.target.sun = Math.max(Cosmos.target.sun, sun);
    Cosmos.target.warp = Math.max(Cosmos.target.warp, S.calm || S.mode === 'gentle' ? warp * 0.4 : warp);
    setAccent(kala > 0.45 ? 'KALA' : speaker);
    body.classList.toggle('vis-high', vis > 0.5);
    Nada.setScene({ vis, kala, speaker });
  }

  function renderSanskrit(el, text) {
    el.innerHTML = '';
    let gi = 0;
    const total = seg(text, 'sa').length, step = Math.min(28, 2200 / Math.max(total, 1));
    text.split('\n').forEach((line, li) => {
      if (li) el.appendChild(document.createElement('br'));
      line.split(' ').forEach((word, wi) => {
        if (wi) el.appendChild(document.createTextNode(' '));
        const w = document.createElement('span'); w.style.whiteSpace = 'nowrap'; w.style.display = 'inline-block';
        seg(word, 'sa').forEach(g => { const s = document.createElement('span'); s.className = 'g'; s.textContent = g; s.style.animationDelay = (gi++ * step) + 'ms'; w.appendChild(s); });
        el.appendChild(w);
      });
    });
  }
  function renderEnglish(el, text, delay = 900) {
    el.innerHTML = '';
    const flat = text.replace(/\s+/g, ' ').trim();
    const words = flat.split(' '); let off = 0;
    const step = Math.min(40, 2600 / words.length);
    words.forEach((w, i) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = w; s.dataset.s = off;
      s.style.animationDelay = (delay + i * step) + 'ms';
      el.appendChild(s); el.appendChild(document.createTextNode(' '));
      off += w.length + 1;
    });
    return flat;
  }
  function highlight(el, charIdx) {
    let hit = null;
    for (const s of el.children) { if (+s.dataset.s <= charIdx) hit = s; else break; }
    el.querySelectorAll('.w.on').forEach(s => s.classList.remove('on'));
    if (hit) hit.classList.add('on');
  }

  function showOnly(which) {
    card.classList.toggle('hidden', which !== card);
    chCard.classList.toggle('hidden', which !== chCard);
    stCard.classList.toggle('hidden', which !== stCard);
  }

  function renderStory(p, isEnd) {
    showOnly(stCard);
    stCard.querySelector('.story-kicker').textContent = p.kicker;
    stCard.querySelector('.story-title').textContent = p.title;
    stCard.querySelector('.story-text').textContent = p.text;
    restartAnim(stCard);
    bigword(isEnd ? 'ॐ तत् सत्' : null);
    scene({ speaker: p.mood, ch: 0, kala: p.kala || 0, warp: 0.5 });
    Nada.whoosh(2.5);
    if (p.conch) { Nada.conch(); setTimeout(() => Nada.conch(), 1800); Maya.strobe(5); }
    if (p.burst || isEnd) { Maya.burst(320, 7); Nada.boom(); Maya.flashSoft(); }
  }

  function renderChapter(ch) {
    const c = DATA.chapters[ch - 1];
    showOnly(chCard);
    chCard.querySelector('.ch-num').innerHTML = `<span class="sa">अध्याय ${toDev(ch)}</span> · CHAPTER ${ch}`;
    chCard.querySelector('.ch-sa').textContent = c.sa;
    chCard.querySelector('.ch-en').textContent = c.en;
    chCard.querySelector('.ch-meaning').textContent = c.meaning;
    chCard.querySelector('.ch-summary').textContent = c.summary.split(/(?<=\.)\s+/).slice(0, 2).join(' ');
    restartAnim(chCard);
    bigword(toDev(ch));
    scene({ speaker: ch === 11 ? 'S' : 'K', ch, vis: ch === 11 ? 0.08 : 0, warp: 1 });
    Nada.conch(); Nada.whoosh(3);
    Maya.burst(380, 8); Maya.strobe(6); Maya.flashSoft();
  }

  function renderVerse(idx) {
    const [ch, v, spk, sa, tr, en, hi, wm, explicit] = DATA.verses[idx];
    showOnly(card);
    const sp = SPEAKERS[spk];
    $('#speaker').innerHTML = `<span class="dot"></span><span class="sa">${sp.sa}</span><span>${sp.en}</span>`;
    renderSanskrit($('#sanskrit'), sa);
    $('#translit').textContent = S.translit ? tr : '';
    $('#translit').classList.toggle('hidden', !S.translit);
    renderEnglish($('#english'), en);
    $('#hindi').textContent = hi; $('#hindi').classList.toggle('hidden', !S.hindi);
    restartAnim($('#hindi'));
    $('#refline').textContent = `॥ ${toDev(ch)}.${toDev(v)} ॥`;
    $('#meanings').innerHTML = wm.split(';').map(p => { const [a, ...b] = p.split('—'); return `<b>${esc(a.trim())}</b> — ${esc(b.join('—').trim())}`; }).join(' · ');
    const vf = vishwaFor(ch, v);
    const key = ch + '.' + v;
    scene({ speaker: spk, ch, ...vf, warp: 0.28 });
    Maya.glyphs(sa, 50 + vf.vis * 60);
    Nada.bowl([1, 9 / 8, 5 / 4, 3 / 2, 5 / 3][(v * 7) % 5], 0.12);
    if (spk === 'K' && Math.random() < 0.3) Nada.flutePhrase(2);
    if (EPIC[key]) {
      bigword(EPIC[key]);
      Nada.boom(); Maya.burst(260 + vf.vis * 300, 7); Maya.strobe(key === '11.32' ? 12 : 5); Maya.flashSoft();
      Cosmos.target.warp = Math.max(Cosmos.target.warp, 0.7);
      if (key === '11.32' || key === '11.12') { body.classList.remove('shake'); void body.offsetWidth; if (!S.calm) body.classList.add('shake'); }
    } else bigword(null);
    if (vf.vis > 0.6 && Math.random() < 0.5) Maya.strobe(3);
  }

  function bigword(w) { const b = $('#bigword'); if (w) { b.textContent = w; b.classList.add('on'); } else b.classList.remove('on'); }
  function restartAnim(el) { [el, ...el.querySelectorAll('*')].forEach(n => { n.style.animation = 'none'; void n.offsetWidth; n.style.animation = ''; }); }
  function esc(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  /* ---------------- navigation ---------------- */
  async function go(i, { fromHash = false } = {}) {
    i = Math.max(0, Math.min(steps.length - 1, i));
    const gen = ++state.gen;
    Voice.stop();
    if (state.started && [card, chCard, stCard].some(el => !el.classList.contains('hidden'))) {
      body.classList.add('leaving'); await sleep(480);
      if (gen !== state.gen) return;
    }
    body.classList.remove('leaving');
    state.i = i; state.started = true;
    const st = steps[i];
    if (st.t === 'pro') renderStory(PROLOGUE[st.i]);
    else if (st.t === 'chap') renderChapter(st.ch);
    else if (st.t === 'verse') renderVerse(st.idx);
    else renderStory(EPILOGUE, true);
    updateHud();
    if (!fromHash) { const h = hashFor(i); if (location.hash !== h) history.replaceState(null, '', h); }
    if (state.playing) narrate(gen);
  }

  async function narrate(gen) {
    const st = steps[state.i];
    const mode = S.voice;
    const t0 = performance.now();
    let chars = 0;
    if (st.t === 'pro' || st.t === 'end') {
      const p = st.t === 'pro' ? PROLOGUE[st.i] : EPILOGUE;
      chars = p.text.length;
      if (mode !== 'off') { await sleep(1200); if (gen !== state.gen) return; await Voice.speak(p.title + '. ' + p.text, 'en', gen, 0.95); }
    } else if (st.t === 'chap') {
      const c = DATA.chapters[st.ch - 1];
      chars = 120;
      await sleep(2200); if (gen !== state.gen) return;
      if (mode === 'hi') await Voice.speak(`अध्याय ${st.ch}. ${c.sa}.`, 'hi', gen, 0.95);
      else if (mode !== 'off') await Voice.speak(`Chapter ${st.ch}. ${c.en}. ${c.meaning}.`, 'en', gen, 0.95);
    } else if (st.t === 'verse') {
      const [, , spk, sa, , en, hi] = DATA.verses[st.idx];
      const pitch = spk === 'K' ? 0.88 : spk === 'A' ? 1.02 : 1.08;
      chars = en.length;
      await sleep(900); if (gen !== state.gen) return;
      const engEl = $('#english');
      if (mode === 'en') await Voice.speak(en, 'en', gen, pitch, c => highlight(engEl, c));
      else if (mode === 'hi') await Voice.speak(hi, 'hi', gen, pitch);
      else if (mode === 'sa') {
        await Voice.speak(sa.replace(/।/g, ','), 'hi', gen, pitch * 0.95);
        if (gen !== state.gen) return;
        await sleep(400);
        await Voice.speak(en, 'en', gen, pitch, c => highlight(engEl, c));
      }
    }
    if (gen !== state.gen) return;
    // pace silent reading, and let every verse breathe before the next
    const minMs = mode === 'off' ? 3000 + chars * 55 / S.rate : 1600;
    const elapsed = performance.now() - t0;
    await sleep(Math.max(1200, minMs - elapsed));
    if (gen !== state.gen || !state.playing) return;
    highlight($('#english'), -1);
    if (!S.auto && st.t === 'verse') { setPlaying(false); return; }
    if (state.i < steps.length - 1) go(state.i + 1); else setPlaying(false);
  }

  function setPlaying(p) {
    state.playing = p;
    body.classList.toggle('playing', p);
    $('#btn-play').setAttribute('aria-label', p ? 'Pause' : 'Play');
    if (p) { Nada.start(); narrate(++state.gen); }
    else { state.gen++; Voice.stop(); body.classList.remove('idle'); }
  }

  function hashFor(i) {
    const st = steps[i];
    if (st.t === 'pro') return '#/prologue/' + (st.i + 1);
    if (st.t === 'chap') return '#/' + st.ch;
    if (st.t === 'verse') { const [c, v] = DATA.verses[st.idx]; return `#/${c}/${v}`; }
    return '#/end';
  }
  function stepFromHash() {
    const m = location.hash.match(/^#\/(prologue|end|\d+)(?:\/(\d+))?/);
    if (!m) return null;
    if (m[1] === 'prologue') return Math.min(PROLOGUE.length, +(m[2] || 1)) - 1;
    if (m[1] === 'end') return steps.length - 1;
    const ch = +m[1];
    if (!chapStep[ch]) return null;
    return m[2] ? (verseStep[ch + '.' + m[2]] ?? chapStep[ch]) : chapStep[ch];
  }
  addEventListener('hashchange', () => { const s = stepFromHash(); if (s != null && s !== state.i && state.started) go(s, { fromHash: true }); });

  /* ---------------- HUD ---------------- */
  const segInfo = [];
  function buildTimeline() {
    const wrap = $('#tl-segs');
    const add = (start, len, label, cls) => {
      const d = document.createElement('div'); d.className = 'tl-seg ' + (cls || ''); d.style.flex = len; d.innerHTML = '<i></i>';
      wrap.appendChild(d); segInfo.push({ el: d, start, len, label });
    };
    add(0, PROLOGUE.length, 'Prologue');
    DATA.chapters.forEach(c => add(chapStep[c.n], c.count + 1, `<b>${c.sa}</b> · ${c.n}. ${c.en}`, c.n === 11 ? 'c11' : ''));
    add(steps.length - 1, 1, 'Om Tat Sat');
    const tl = $('#timeline'), tip = $('#tl-tip');
    const stepAt = x => {
      for (const s of segInfo) { const r = s.el.getBoundingClientRect(); if (x <= r.right + 2) return { s, i: s.start + Math.min(s.len - 1, Math.max(0, Math.floor((x - r.left) / r.width * s.len))) }; }
      const s = segInfo[segInfo.length - 1]; return { s, i: s.start };
    };
    tl.addEventListener('pointermove', e => {
      const { s, i } = stepAt(e.clientX); const st = steps[i];
      const sub = st.t === 'verse' ? ` · ${DATA.verses[st.idx][0]}.${DATA.verses[st.idx][1]}` : '';
      tip.innerHTML = s.label + sub; tip.style.left = (e.clientX - tl.getBoundingClientRect().left) + 'px';
    });
    tl.addEventListener('click', e => go(stepAt(e.clientX).i));
    tl.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.stopPropagation(); go(state.i + 1); } if (e.key === 'ArrowLeft') { e.stopPropagation(); go(state.i - 1); } });
  }

  function currentChapter() {
    const st = steps[state.i];
    return st.t === 'chap' ? st.ch : st.t === 'verse' ? DATA.verses[st.idx][0] : st.t === 'end' ? 18 : 0;
  }

  function updateHud() {
    const st = steps[state.i];
    const ch = currentChapter();
    if (st.t === 'pro') { $('#now').innerHTML = `<b>कुरुक्षेत्र</b>The Field of Kurukshetra`; $('#counter').textContent = `PROLOGUE ${st.i + 1}/${PROLOGUE.length}`; }
    else if (st.t === 'end') { $('#now').innerHTML = `<b>ॐ तत् सत्</b>Om Tat Sat`; $('#counter').textContent = '700 / 700'; }
    else {
      const c = DATA.chapters[ch - 1];
      $('#now').innerHTML = `<b>${c.sa}</b>${ch}. ${c.en}`;
      $('#counter').textContent = st.t === 'verse' ? `${ch}.${DATA.verses[st.idx][1]}  ·  ${st.idx + 1} / ${DATA.verses.length}` : `CHAPTER ${ch}`;
    }
    segInfo.forEach(s => {
      const f = Math.max(0, Math.min(1, (state.i - s.start + 1) / s.len));
      s.el.querySelector('i').style.width = (f * 100) + '%';
    });
    const s = segInfo.find(s => state.i >= s.start && state.i < s.start + s.len) || segInfo[segInfo.length - 1];
    const tl = $('#timeline').getBoundingClientRect(), r = s.el.getBoundingClientRect();
    $('#tl-head').style.left = (r.left - tl.left + (state.i - s.start + 0.5) / s.len * r.width) + 'px';
    $('#timeline').setAttribute('aria-valuenow', state.i);
    // drawer highlight
    document.querySelectorAll('#chapters button').forEach(b => b.classList.toggle('cur', +b.dataset.ch === ch));
    if (drawerCh === ch) renderGrid(ch);
  }

  /* ---------------- drawer ---------------- */
  let drawerCh = 1;
  function buildDrawer() {
    const ol = $('#chapters');
    DATA.chapters.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `<button data-ch="${c.n}" class="${c.n === 11 ? 'c11' : ''}"><span class="n">${c.n}</span><span class="t"><b>${c.sa}</b><i>${c.en} · ${c.count} verses</i></span></button>`;
      ol.appendChild(li);
    });
    ol.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const ch = +b.dataset.ch;
      if (drawerCh === ch && $('#verse-grid').childElementCount) { go(chapStep[ch]); closePanels(); return; }
      drawerCh = ch; renderGrid(ch);
      go(chapStep[ch]);
    });
    $('#verse-grid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { go(+b.dataset.step); if (innerWidth < 720) closePanels(); } });
    $('#go-prologue').onclick = () => { go(0); closePanels(); };
  }
  function renderGrid(ch) {
    const g = $('#verse-grid'); const c = DATA.chapters[ch - 1];
    let h = '';
    for (let v = 1; v <= c.count; v++) {
      const si = verseStep[ch + '.' + v]; if (si == null) continue;
      const spk = DATA.verses[steps[si].idx][2];
      h += `<button data-step="${si}" class="${spk}${si === state.i ? ' cur' : ''}" title="${ch}.${v}">${v}</button>`;
    }
    g.innerHTML = h;
  }

  /* ---------------- panels, idle, keys ---------------- */
  function openPanel(id) { closePanels(); const p = $(id); p.classList.add('open'); p.setAttribute('aria-hidden', 'false'); }
  function closePanels() { document.querySelectorAll('.drawer, .panel').forEach(p => { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); }); }
  const anyOpen = () => !!document.querySelector('.drawer.open, .panel.open');

  let idleT;
  function poke() {
    body.classList.remove('idle'); clearTimeout(idleT);
    idleT = setTimeout(() => { if (state.playing && !anyOpen()) body.classList.add('idle'); }, 3500);
  }
  ['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, poke, { passive: true }));

  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }

  function setCalm(c) {
    S.calm = c; save();
    body.classList.toggle('calm', c);
    $('#btn-calm').classList.toggle('active', c);
    Maya.setCalm(c);
    Cosmos.set({ calm: c ? 1 : 0 });
    if (c) { Cosmos.target.warp = 0; Cosmos.target.sun = 0; body.classList.remove('shake'); }
  }
  function setMode(m) {
    S.mode = m; save(); Maya.setMode(m);
    $('#set-mode').value = m;
    Cosmos.set({ int: { gentle: 0.35, cosmic: 0.78, transcendent: 1 }[m] });
  }
  function toggleMute() { S.muted = !S.muted; save(); Nada.setMuted(S.muted); $('#btn-sound').classList.toggle('off', S.muted); toast(S.muted ? 'Cosmic sound muted' : 'Cosmic sound on'); }
  function toggleFull() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.(); }
  function toggleWords() { const m = $('#meanings'); m.classList.toggle('hidden'); $('#btn-words').classList.toggle('active', !m.classList.contains('hidden')); }
  function chapterJump(d) { const ch = currentChapter(); const n = Math.max(1, Math.min(18, (ch || (d > 0 ? 0 : 1)) + d)); go(chapStep[n]); }
  const goVishwa = () => { go(verseStep['11.5']); toast('विश्वरूपदर्शन — The Vision of the Universal Form'); };

  addEventListener('keydown', e => {
    if (!state.started || e.target.matches('input, select, textarea')) return;
    const k = e.key;
    if (k === 'Escape') { if (anyOpen()) closePanels(); if (!S.calm) { setCalm(true); toast('Visuals calmed — tap “Calm” to restore'); } return; }
    if (k === ' ') { e.preventDefault(); setPlaying(!state.playing); }
    else if (k === 'ArrowRight') go(state.i + 1);
    else if (k === 'ArrowLeft') go(state.i - 1);
    else if (k === 'ArrowUp') { e.preventDefault(); chapterJump(-1); }
    else if (k === 'ArrowDown') { e.preventDefault(); chapterJump(1); }
    else if (k === 'c' || k === 'C') anyOpen() ? closePanels() : (drawerCh = currentChapter() || 1, renderGrid(drawerCh), openPanel('#drawer'));
    else if (k === 'v' || k === 'V') goVishwa();
    else if (k === 'w' || k === 'W') toggleWords();
    else if (k === 'm' || k === 'M') toggleMute();
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === '?') openPanel('#help');
  });

  // swipe on touch
  let tx = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', e => {
    if (tx == null || !state.started || anyOpen()) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 70) go(state.i + (dx < 0 ? 1 : -1));
  }, { passive: true });

  function wireUi() {
    $('#btn-play').onclick = () => setPlaying(!state.playing);
    $('#btn-next').onclick = () => go(state.i + 1);
    $('#btn-prev').onclick = () => go(state.i - 1);
    $('#btn-vishwa').onclick = goVishwa;
    $('#btn-calm').onclick = () => { setCalm(!S.calm); toast(S.calm ? 'Calm visuals' : 'Full cosmos restored'); };
    $('#btn-sound').onclick = toggleMute;
    $('#btn-full').onclick = toggleFull;
    $('#btn-words').onclick = toggleWords;
    $('#btn-settings').onclick = () => openPanel('#settings');
    $('#open-drawer').onclick = () => { drawerCh = currentChapter() || 1; renderGrid(drawerCh); openPanel('#drawer'); };
    $('#close-drawer').onclick = $('#close-settings').onclick = $('#close-help').onclick = closePanels;
    $('#gl').addEventListener('click', closePanels);

    const sm = $('#set-mode'), sv = $('#set-voice');
    sm.value = S.mode; sv.value = S.voice;
    $('#set-rate').value = S.rate; $('#set-vol').value = S.vol; $('#set-vvol').value = S.vvol;
    $('#set-hindi').checked = S.hindi; $('#set-translit').checked = S.translit; $('#set-auto').checked = S.auto;
    sm.onchange = () => { if (sm.value === 'transcendent' && !confirm('Transcendent mode contains rapid flashing and strobing. Continue?')) { sm.value = S.mode; return; } setMode(sm.value); };
    sv.onchange = () => { S.voice = sv.value; save(); if (state.playing) narrate(++state.gen); };
    $('#set-rate').oninput = e => { S.rate = +e.target.value; save(); };
    $('#set-vol').oninput = e => { S.vol = +e.target.value; save(); Nada.setVolume(S.vol); };
    $('#set-vvol').oninput = e => { S.vvol = +e.target.value; save(); };
    $('#set-hindi').onchange = e => { S.hindi = e.target.checked; save(); $('#hindi').classList.toggle('hidden', !S.hindi); };
    $('#set-translit').onchange = e => { S.translit = e.target.checked; save(); const st = steps[state.i]; if (st.t === 'verse') { $('#translit').textContent = S.translit ? DATA.verses[st.idx][4] : ''; $('#translit').classList.toggle('hidden', !S.translit); } };
    $('#set-auto').onchange = e => { S.auto = e.target.checked; save(); };
    addEventListener('resize', () => state.started && updateHud());
  }

  /* ---------------- gate ---------------- */
  function showGate() {
    $('#loader').classList.add('hidden');
    $('#gate').classList.remove('hidden');
    document.querySelector(`input[name=mode][value=${S.mode}]`).checked = true;
    $('#gate-voice').value = S.voice;
    const resume = stepFromHash();
    if (resume != null && resume > 0) {
      const b = document.querySelector('[data-start=prologue] span');
      b.textContent = 'Continue the journey';
      document.querySelector('[data-start=prologue]').dataset.start = 'resume';
    }
    document.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => {
      const mode = document.querySelector('input[name=mode]:checked').value;
      setMode(mode);
      S.voice = $('#gate-voice').value; save();
      $('#set-voice').value = S.voice;
      Nada.start(); Nada.setVolume(S.vol); if (S.muted) { Nada.setMuted(true); $('#btn-sound').classList.add('off'); }
      // unlock speech on iOS with an empty utterance inside the gesture
      if (synth) { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) {} }
      $('#gate').classList.add('hidden');
      $('#stage').classList.remove('hidden');
      $('#top').classList.remove('hidden'); $('#transport').classList.remove('hidden');
      const which = b.dataset.start;
      const start = which === 'resume' ? stepFromHash() : which === 'ch1' ? chapStep[1] : which === 'vishwa' ? verseStep['11.1'] : 0;
      state.playing = true; body.classList.add('playing');
      go(start ?? 0);
      poke();
    }));
  }

  /* ---------------- main loop ---------------- */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const lvl = Nada.level();
    const pulse = 0.5 + 0.5 * Math.sin(now / 1000 * Math.PI * 2 * 0.25); // a slow cosmic heartbeat
    const beat = S.calm ? 0 : Math.min(1, lvl * 1.6 * 0.6 + pulse * 0.25);
    Cosmos.target.beat = beat;
    Cosmos.frame(now, dt);
    Maya.frame(now, dt, S.calm ? 0 : beat * 0.4, Cosmos.params.vis);
    requestAnimationFrame(loop);
  }

  /* ---------------- boot ---------------- */
  async function boot() {
    if (!Cosmos.init($('#gl'))) $('#loader-text').textContent = 'WebGL unavailable — the text journey still works.';
    Maya.init($('#fx'), $('#blocks'), $('#strobe'));
    setCalm(S.calm); Maya.setMode(S.mode);
    Cosmos.set({ c1: PALETTES.S[0], c2: PALETTES.S[1], c3: PALETTES.S[2], int: 0.8 });
    requestAnimationFrame(loop);
    try {
      const r = await fetch('data/gita.json');
      DATA = await r.json();
    } catch (e) { $('#loader-text').textContent = 'Could not load the verses. Please refresh.'; return; }
    buildSteps(); buildTimeline(); buildDrawer(); wireUi();
    await sleep(600);
    showGate();
  }
  boot();
})();
