'use strict';

/* ------------------------------------------------------------------
   Settings
   ------------------------------------------------------------------ */

// Midnight in Norway (CET, UTC+1) on 12 November 2026.
const BIRTHDAY = new Date('2026-11-12T00:00:00+01:00');
const SPOTIFY_URI = 'spotify:track:3OBdxB44t6P7k5xyPxb3WZ';
const DAY_MS = 24 * 60 * 60 * 1000;

// Test helpers:  ?t=15  → countdown ends 15 s from now.   ?party → skip to the party.
const params = new URLSearchParams(location.search);
let target = BIRTHDAY;
if (params.has('t')) target = new Date(Date.now() + (Number(params.get('t')) || 15) * 1000);
if (params.has('party')) target = new Date(Date.now() - 1000);

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

const PHRASES = [
  'The world is holding its breath',
  'Scientists cannot explain it',
  'Amplifiers are warming up',
  'The hair is getting redder',
  'Somewhere, a guitar is being tuned',
  'NASA has been notified',
  'The tea is brewing',
  'This is not a drill',
  'Birthday levels: critical',
  'The prophecy is near',
  'Leopards are on standby',
  '“Oh Yeah” is loading',
];
const URGENT_PHRASES = [
  "It's happening",
  'No turning back',
  'Brace yourselves',
  'This is it',
  'Hold on to something',
];
const TICKER = [
  'Local legend approaches birthday at alarming speed',
  'Experts confirm: this is the big one',
  'Red hair dye reserves at all-time low',
  'Guitars worldwide retuned to the key of Christopher',
  'Leopards demand their print back',
  'Global tea supplies redirected to one party',
  'Amplifiers everywhere quietly turned up to 11',
  'Cake industry on high alert',
  'Scientists: “We have never measured this much legend in one person”',
  'The world is about to know',
];
const KNOWS = [
  'Oslo', 'Bergen', 'Trondheim', 'Tromsø', 'London', 'Tokyo', 'New York',
  'Buenos Aires', 'Antarctica', 'The Moon', 'Every record shop on Earth',
];
// Two photos from a friend, the rest from instagram.com/ramonasteaparty
const PHOTOS = [
  { src: 'images/band-festival.jpg', w: 1000, h: 666, caption: 'The world knows', alt: 'Ramonas Tea Party on a festival stage in front of a huge crowd' },
  { src: 'images/stage-stripes.jpg', w: 1500, h: 2000, caption: 'Oh yeah!', alt: 'Christopher sings and plays a red guitar on stage' },
  { src: 'images/timer-selfie.jpg', w: 760, h: 1000, caption: 'Countdown mode', alt: 'Christopher holds up a phone timer in a selfie with a bandmate' },
  { src: 'images/stage-leopard.webp', w: 2000, h: 1333, caption: 'Rock god', alt: 'Christopher in a leopard shirt sticks his tongue out on an outdoor stage' },
  { src: 'images/stage-yellow-guitar.jpg', w: 1000, h: 1000, caption: 'Birthday boy', alt: 'Christopher sings with a yellow guitar next to a bandmate' },
  { src: 'images/pole.jpg', w: 750, h: 1000, caption: 'Legend', alt: 'Christopher holds a long wooden pole while a bandmate looks shocked' },
  { src: 'images/stage-banner.jpg', w: 754, h: 1000, caption: 'Tea party!', alt: 'The Ramonas Tea Party stage with the band banner and guitars' },
  { src: 'images/fan-art.jpg', w: 750, h: 1000, caption: 'Fan art ♥', alt: 'A hand-drawn Ramonas Tea Party sign' },
];

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const rand = (min, max) => min + Math.random() * (max - min);
const pad = (n) => String(n).padStart(2, '0');

function shake(el, strength = 14, duration = 380) {
  if (REDUCED_MOTION) return;
  const s = strength;
  el.animate([
    { transform: 'translate(0, 0)' },
    { transform: `translate(${-s}px, ${s * .6}px)` },
    { transform: `translate(${s * .8}px, ${-s * .7}px)` },
    { transform: `translate(${-s * .5}px, ${s * .4}px)` },
    { transform: `translate(${s * .3}px, ${-s * .2}px)` },
    { transform: 'translate(0, 0)' },
  ], { duration, easing: 'ease-out' });
}

/* ------------------------------------------------------------------
   Sound effects (Web Audio, no files)
   ------------------------------------------------------------------ */

const sfx = (() => {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let muted = false;
  const VOLUME = 0.9;

  function init() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  function envelope(gain, t, peak, attack, decay) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function thump(t, freq, peak, decay) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.45, t + decay);
    envelope(g, t, peak, 0.005, decay);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + decay + 0.1);
  }

  function noise(t, type, freq, peak, decay) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    envelope(g, t, peak, 0.005, decay);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + decay + 0.1);
  }

  const ready = () => ctx && !muted;

  return {
    init,
    heartbeat(level = 0.5) {
      if (!ready()) return;
      const t = ctx.currentTime;
      thump(t, 120, 0.9 * level, 0.22);
      noise(t, 'lowpass', 500, 0.25 * level, 0.05);
      thump(t + 0.17, 100, 0.6 * level, 0.28);
    },
    boom() {
      if (!ready()) return;
      const t = ctx.currentTime;
      thump(t, 170, 1, 1.1);
      thump(t, 85, 0.8, 1.4);
      noise(t, 'lowpass', 900, 0.7, 0.6);
    },
    riser(seconds) {
      if (!ready()) return;
      const t = ctx.currentTime;
      const end = t + seconds;
      // Swelling noise
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 5;
      bp.frequency.setValueAtTime(250, t);
      bp.frequency.exponentialRampToValueAtTime(7000, end);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.55, end);
      src.connect(bp).connect(ng).connect(master);
      src.start(t);
      src.stop(end);
      // Rising synth (two detuned saws)
      [0, 9].forEach((detune) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.detune.value = detune;
        o.frequency.setValueAtTime(70, t);
        o.frequency.exponentialRampToValueAtTime(880, end);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(400, t);
        lp.frequency.exponentialRampToValueAtTime(4000, end);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, end);
        o.connect(lp).connect(g).connect(master);
        o.start(t);
        o.stop(end);
      });
    },
    crash() {
      if (!ready()) return;
      const t = ctx.currentTime;
      thump(t, 160, 1, 1.6);
      noise(t, 'highpass', 2500, 0.6, 2.8);
      // Big D major chord
      [146.83, 220, 293.66, 369.99, 440, 587.33].forEach((freq) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(3500, t);
        lp.frequency.exponentialRampToValueAtTime(600, t + 3);
        const g = ctx.createGain();
        envelope(g, t, 0.07, 0.02, 3);
        o.connect(lp).connect(g).connect(master);
        o.start(t);
        o.stop(t + 3.2);
      });
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.setTargetAtTime(value ? 0 : VOLUME, ctx.currentTime, 0.05);
    },
    get muted() { return muted; },
  };
})();

/* ------------------------------------------------------------------
   Spotify player (official iFrame API)
   ------------------------------------------------------------------ */

const spotify = (() => {
  let controller = null;
  let isReady = false;
  let wantPlay = false;

  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    IFrameAPI.createController($('spotify'), { uri: SPOTIFY_URI, width: '100%', height: 152 }, (c) => {
      controller = c;
      c.addListener('ready', () => {
        isReady = true;
        if (wantPlay) c.play();
      });
    });
  };

  return {
    play() {
      wantPlay = true;
      if (controller && isReady) controller.play();
    },
    pause() {
      wantPlay = false;
      if (controller && isReady) controller.pause();
    },
  };
})();

/* ------------------------------------------------------------------
   Particles: embers, confetti, hearts, fireworks
   ------------------------------------------------------------------ */

const fx = (() => {
  const canvas = $('fx');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#ff1f3d', '#f5ecd6', '#ffb627', '#3fd0c0', '#ffffff', '#0b0607'];
  const FIREWORK_COLORS = ['#ff1f3d', '#ffb627', '#3fd0c0', '#f5ecd6', '#ff6b81'];
  const GRAVITY = 0.16;
  const MAX = REDUCED_MOTION ? 400 : 1600;
  const parts = [];
  let W = 0;
  let H = 0;
  let mode = 'idle';      // idle | countdown | urgent | party
  let partyStart = 0;
  let nextRocket = 0;
  let carry = 0;
  let last = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  const add = (p) => { if (parts.length < MAX) parts.push(p); };

  function ember() {
    add({
      kind: 'ember', x: rand(0, W), y: H + 10, vx: rand(-.3, .3), vy: -rand(.5, 1.8),
      life: 1, decay: rand(.003, .007), size: rand(1, 2.8), color: Math.random() < .7 ? '#ff3b4f' : '#ffb627',
    });
  }

  function confetti(x, y, n, vxRange, vyRange) {
    for (let i = 0; i < n; i++) {
      add({
        kind: 'confetti', x, y, vx: rand(...vxRange), vy: rand(...vyRange),
        rot: rand(0, Math.PI * 2), vr: rand(-.25, .25), wob: rand(0, 6), w: rand(6, 13), h: rand(4, 8),
        color: pick(COLORS), heart: Math.random() < .2, life: 1, decay: rand(.0025, .005),
      });
    }
  }

  function rain(n) {
    for (let i = 0; i < n; i++) confetti(rand(0, W), -20, 1, [-1, 1], [1, 3]);
  }

  function cannons() {
    const n = REDUCED_MOTION ? 60 : 160;
    confetti(0, H, n, [4, 16], [-22, -10]);
    confetti(W, H, n, [-16, -4], [-22, -10]);
  }

  function burst(x, y) {
    const n = REDUCED_MOTION ? 40 : 90;
    const color = pick(FIREWORK_COLORS);
    const color2 = pick(FIREWORK_COLORS);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const speed = rand(2, 6.5);
      add({
        kind: 'spark', x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 1, decay: rand(.01, .02), size: rand(1.5, 2.8), color: Math.random() < .75 ? color : color2,
      });
    }
  }

  function rocket(x = rand(W * .15, W * .85)) {
    add({
      kind: 'rocket', x, y: H + 5, vx: rand(-1.2, 1.2), vy: -Math.sqrt(2 * GRAVITY * H * rand(.5, .8)),
      life: 1, decay: 0, size: 2.5, color: '#fff3d6',
    });
  }

  function barrage(count = 6) {
    for (let i = 0; i < count; i++) setTimeout(() => rocket(), i * 180);
  }

  function heart(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * .3);
    ctx.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3);
    ctx.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .75, x, y + s);
    ctx.bezierCurveTo(x, y + s * .75, x + s * .5, y + s * .6, x + s * .5, y + s * .3);
    ctx.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3);
    ctx.fill();
  }

  function spawn(now, dt) {
    let rate = 0;
    if (mode === 'countdown') rate = .25;
    if (mode === 'urgent') rate = 2;
    if (mode === 'party') {
      const age = now - partyStart;
      rate = age < 20000 ? .6 : .08;
      if (now > nextRocket) {
        rocket();
        nextRocket = now + (age < 30000 ? rand(500, 1300) : rand(2500, 5000));
      }
    }
    if (REDUCED_MOTION) rate /= 3;
    carry += rate * dt;
    while (carry >= 1) {
      carry -= 1;
      if (mode === 'party') rain(1); else ember();
    }
  }

  function frame(now) {
    const dt = Math.min((now - last) / 16.67, 3);
    last = now;
    spawn(now, dt);
    ctx.clearRect(0, 0, W, H);

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.kind === 'confetti') {
        p.vy = Math.min(p.vy + GRAVITY * dt, 3.2);
        p.vx *= Math.pow(.97, dt);
        p.wob += .08 * dt;
        p.x += (p.vx + Math.sin(p.wob) * .8) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= p.decay * dt;
      } else if (p.kind === 'rocket') {
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (Math.random() < .7) {
          add({ kind: 'spark', x: p.x, y: p.y, vx: rand(-.4, .4), vy: rand(.5, 1.5), life: .6, decay: .04, size: 1.6, color: '#ffb627' });
        }
        if (p.vy >= -0.6) {
          burst(p.x, p.y);
          p.life = 0;
        }
      } else if (p.kind === 'spark') {
        p.vy += GRAVITY * .45 * dt;
        p.vx *= Math.pow(.975, dt);
        p.vy *= Math.pow(.975, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
      }

      if (p.life <= 0 || p.y > H + 40 || p.x < -60 || p.x > W + 60) {
        parts.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.rot * 1.7));
        if (p.heart) heart(0, -p.w / 2, p.w * 1.3);
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha *= .35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setMode(m) {
      mode = m;
      if (m === 'party') {
        partyStart = performance.now();
        nextRocket = partyStart + 600;
      }
    },
    cannons,
    barrage,
    burst,
    clear() { parts.length = 0; },
  };
})();

/* ------------------------------------------------------------------
   Build the static parts of the page
   ------------------------------------------------------------------ */

function buildTicker() {
  const items = TICKER.map((t) => `<span class="ticker__tag">Breaking</span>${t}`).join(' ');
  $('ticker').innerHTML = `${items} ${items} `;
}

function buildKnows() {
  $('knowsList').innerHTML = KNOWS
    .map((place, i) => `<li style="--i:${i};--r:${rand(-4, 4).toFixed(1)}deg"><b>${place}</b> knows</li>`)
    .join('');
  const section = $('knows');
  if (!('IntersectionObserver' in window)) { section.classList.add('seen'); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      section.classList.add('seen');
      io.disconnect();
    }
  }, { threshold: .3 });
  io.observe(section);
}

function buildReel() {
  // All photos, then the same photos again, so the loop has no seam.
  const frames = PHOTOS.map((photo, i) => {
    const r = (i % 2 ? 1 : -1) * rand(1.5, 4);
    return `<figure class="polaroid" style="--r:${r.toFixed(1)}deg">
      <img src="${photo.src}" width="${photo.w}" height="${photo.h}" alt="${photo.alt}" decoding="async">
      <figcaption>${photo.caption}</figcaption>
    </figure>`;
  }).join('');
  $('reel').innerHTML = frames + frames.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"');
}

buildTicker();
buildKnows();
buildReel();

/* ------------------------------------------------------------------
   The show
   ------------------------------------------------------------------ */

const els = {
  gate: $('gate'),
  countdown: $('countdown'),
  final: $('final'),
  finalNum: $('finalNum'),
  flash: $('flash'),
  party: $('party'),
  hero: $('hero'),
  timer: $('timer'),
  phrase: $('phrase'),
  pct: $('pct'),
  bar: $('bar'),
  cs: $('cs'),
  mute: $('mute'),
};

let phase = 'gate';        // gate | countdown | final | party
let lastSecond = null;
let phraseIndex = 0;
let partyTimers = [];

function setPair(id, value) {
  const [a, b] = $(id).children;
  const s = pad(value);
  if (a.textContent !== s[0]) a.textContent = s[0];
  if (b.textContent !== s[1]) b.textContent = s[1];
}

function nextPhrase(list) {
  phraseIndex = (phraseIndex + 1) % list.length;
  els.phrase.textContent = list[phraseIndex];
  els.phrase.classList.remove('glitch');
  void els.phrase.offsetWidth;
  els.phrase.classList.add('glitch');
}

function onNewSecond(ms, secondsLeft) {
  // Last ten seconds: giant numbers.
  if (ms <= 10000) {
    if (phase !== 'final') {
      phase = 'final';
      els.final.hidden = false;
      fx.setMode('urgent');
      sfx.riser(ms / 1000);
    }
    const n = Math.ceil(ms / 1000);
    els.finalNum.textContent = n;
    els.finalNum.animate([
      { transform: 'scale(2.8)', opacity: 0, filter: 'blur(18px)' },
      { transform: 'scale(.94)', opacity: 1, filter: 'blur(0)', offset: .3 },
      { transform: 'scale(1)', opacity: 1, offset: .7 },
      { transform: 'scale(.8)', opacity: 0 },
    ], { duration: 1000, easing: 'ease-out', fill: 'both' });
    els.final.animate([{ background: '#c4001f' }, { background: '#000' }], { duration: 700, easing: 'ease-out' });
    shake(els.final, 10 + (10 - n) * 2.5);
    sfx.boom();
    return;
  }

  const urgent = ms <= 60000;
  els.countdown.classList.toggle('urgent', urgent);
  fx.setMode(urgent ? 'urgent' : 'countdown');

  els.timer.animate([{ transform: 'scale(1.045)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });

  if (ms <= 5 * 60000) sfx.heartbeat(urgent ? 1 : 0.55);
  else if (secondsLeft % 2 === 0) sfx.heartbeat(0.3);

  if (urgent && secondsLeft % 3 === 0) nextPhrase(URGENT_PHRASES);
  else if (!urgent && secondsLeft % 6 === 0) nextPhrase(PHRASES);

  document.title = `${els.timer.textContent.replace(/\s+/g, '').slice(0, 8)} · Something huge happens at midnight`;
}

function tick() {
  if (phase === 'party' || phase === 'gate') return;
  const now = Date.now();
  const ms = target - now;
  if (ms <= 0) { startParty(); return; }

  const secondsLeft = Math.floor(ms / 1000);
  setPair('hh', Math.floor(secondsLeft / 3600));
  setPair('mm', Math.floor((secondsLeft % 3600) / 60));
  setPair('ss', secondsLeft % 60);
  els.cs.textContent = '.' + pad(Math.floor((ms % 1000) / 10));

  const start = target - DAY_MS;
  const pct = Math.max(0, Math.min(1, (now - start) / DAY_MS)) * 100;
  els.pct.textContent = pct.toFixed(6) + '%';
  els.bar.style.width = pct + '%';

  const shownSecond = Math.ceil(ms / 1000);
  if (shownSecond !== lastSecond) {
    lastSecond = shownSecond;
    onNewSecond(ms, secondsLeft);
  }
  requestAnimationFrame(tick);
}

function startCountdown() {
  phase = 'countdown';
  lastSecond = null;
  els.countdown.hidden = false;
  document.body.classList.add('is-locked');
  fx.setMode('countdown');
  requestAnimationFrame(tick);
}

function startParty() {
  phase = 'party';
  els.countdown.hidden = true;
  els.final.hidden = true;
  document.body.classList.remove('is-locked');
  window.scrollTo(0, 0);
  document.title = '🎉 HAPPY BIRTHDAY CHRISTOPHER 🎉';

  els.flash.animate([{ opacity: 1 }, { opacity: 1, offset: .12 }, { opacity: 0 }], { duration: 1800, easing: 'ease-out' });
  sfx.crash();
  spotify.play();

  els.party.classList.add('is-live');
  fx.setMode('party');
  fx.cannons();
  fx.barrage(5);

  // "AND THE WORLD KNOWS!" lands at 4.2 s (see style.css).
  partyTimers.push(setTimeout(() => {
    sfx.boom();
    shake(els.hero, 18, 500);
    fx.cannons();
    fx.barrage(8);
  }, 4300));
}

function replay() {
  partyTimers.forEach(clearTimeout);
  partyTimers = [];
  spotify.pause();
  fx.clear();
  els.party.classList.remove('is-live');
  els.countdown.classList.remove('urgent');
  target = new Date(Date.now() + 11000);
  startCountdown();
}

/* ------------------------------------------------------------------
   Wiring
   ------------------------------------------------------------------ */

if (target - Date.now() <= 0) {
  $('gateLabel').textContent = 'It has happened';
  $('gateTitle').innerHTML = 'The wait<br>is over';
  $('enter').textContent = 'Turn the sound up & enter the party';
}

$('enter').addEventListener('click', () => {
  sfx.init();
  els.gate.hidden = true;
  els.mute.hidden = false;
  if (target - Date.now() <= 0) startParty();
  else startCountdown();
});

els.mute.addEventListener('click', () => {
  sfx.setMuted(!sfx.muted);
  els.mute.textContent = sfx.muted ? '🔇' : '🔊';
  els.mute.setAttribute('aria-label', sfx.muted ? 'Unmute sound effects' : 'Mute sound effects');
});

$('replay').addEventListener('click', (e) => {
  e.stopPropagation();
  replay();
});

// Tap anywhere on the party for your own firework.
els.party.addEventListener('pointerdown', (e) => {
  if (phase !== 'party' || e.target.closest('button, a, iframe')) return;
  fx.burst(e.clientX, e.clientY);
});
