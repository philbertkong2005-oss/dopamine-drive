// ============================================================
// DOPAMINE DRIVE — app logic
// ============================================================

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = n => '$' + Math.round(n).toLocaleString('en-CA');

// ---------- state ----------
const state = {
  view: 'showroom',
  filters: { body: 'all', price: 'all' },
  build: null,           // { carId, trim, color, wheel, packages:Set }
  compare: [null, null], // refs like {kind:'stock', carId, trimId} or {kind:'garage', buildId}
  lastTotal: 0,
};

const store = {
  get garage() { try { return JSON.parse(localStorage.getItem('dd_garage') || '[]'); } catch { return []; } },
  set garage(v) { localStorage.setItem('dd_garage', JSON.stringify(v)); },
  get claims() { try { return JSON.parse(localStorage.getItem('dd_claims') || '{}'); } catch { return {}; } },
  set claims(v) { localStorage.setItem('dd_claims', JSON.stringify(v)); },
  get muted() { return localStorage.getItem('dd_mute') === '1'; },
  set muted(v) { localStorage.setItem('dd_mute', v ? '1' : '0'); },
};

// ---------- sound (tiny WebAudio synth) ----------
const Sound = (() => {
  let ctx;
  const ac = () => (ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());
  function tone(freq, dur = 0.08, type = 'sine', gain = 0.12, when = 0) {
    if (store.muted) return;
    try {
      const a = ac(), o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(gain, a.currentTime + when);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + when + dur);
      o.connect(g); g.connect(a.destination);
      o.start(a.currentTime + when); o.stop(a.currentTime + when + dur + 0.02);
    } catch { /* audio blocked — fine */ }
  }
  return {
    click: () => tone(660, 0.06, 'sine', 0.08),
    select: () => { tone(520, 0.07, 'sine', 0.1); tone(780, 0.09, 'sine', 0.08, 0.05); },
    paint: () => tone(880, 0.1, 'triangle', 0.09),
    kaching: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.11, i * 0.07)); },
    reveal: () => { [196, 262, 330, 392, 523].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, i * 0.09)); },
    whoosh: () => tone(220, 0.18, 'sawtooth', 0.03),
  };
})();

// ---------- confetti ----------
const Confetti = (() => {
  const cv = $('#confetti'), cx = cv.getContext('2d');
  let parts = [], raf = null;
  function resize() { cv.width = innerWidth; cv.height = innerHeight; }
  addEventListener('resize', resize); resize();
  function burst(n = 140) {
    const colors = ['#ff3d71', '#ff8a3d', '#38bdf8', '#a3e635', '#fbbf24', '#a78bfa', '#ffffff'];
    for (let i = 0; i < n; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 300,
        y: innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        w: 6 + Math.random() * 7, h: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        c: colors[(Math.random() * colors.length) | 0],
        life: 1,
      });
    }
    if (!raf) tick();
  }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life > 0 && p.y < cv.height + 30);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.vx *= 0.99;
      p.rot += p.vr; p.life -= 0.006;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.globalAlpha = Math.max(0, p.life);
      cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cx.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : (cx.clearRect(0, 0, cv.width, cv.height), null);
  }
  return { burst };
})();

// ---------- helpers ----------
const carById = id => CARS.find(c => c.id === id);
const minPrice = car => Math.min(...car.trims.map(t => t.price));

function buildTotal(b) {
  const car = carById(b.carId);
  const trim = car.trims.find(t => t.id === b.trim);
  const color = car.colors[b.color];
  const wheel = car.wheels[b.wheel];
  let total = trim.price + color.price + wheel.price;
  for (const i of b.packages) total += car.packages[i].price;
  return total;
}

function artFor(car, b) {
  return Art.car({
    body: car.art.body,
    len: car.art.len,
    wing: car.art.wing,
    paint: b ? car.colors[b.color].hex : car.colors[0].hex,
    wheelStyle: b ? car.wheels[b.wheel].style : car.wheels[0].style,
  });
}

// today's barn find — deterministic by date
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todaysBarnFind() {
  const key = todayKey();
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return BARNFINDS[h % BARNFINDS.length];
}

// ---------- price ticker animation ----------
function animateTicker(el, from, to) {
  const dur = 550, t0 = performance.now();
  function step(t) {
    const k = Math.min(1, (t - t0) / dur);
    const ease = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * ease);
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------- views ----------
const main = $('#main');

function go(view) {
  state.view = view;
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  Sound.whoosh();
  renders[view]();
  scrollTo({ top: 0, behavior: 'instant' });
}

// --- showroom ---
function renderShowroom() {
  const { body, price } = state.filters;
  let cars = CARS;
  if (body !== 'all') cars = cars.filter(c => c.body === body);
  if (price !== 'all') {
    const b = PRICE_BUCKETS.find(p => p.id === price);
    cars = cars.filter(c => minPrice(c) >= b.min && minPrice(c) < b.max);
  }
  main.innerHTML = `
  <div class="view">
    <div class="h1">Pick your poison ⚡</div>
    <div class="sub">Every car. Every option. Infinite budget. Zero consequences.</div>
    <div class="filters">
      ${BODY_FILTERS.map(f => `<button class="chip ${body === f.id ? 'on' : ''}" data-body="${f.id}">${f.label}</button>`).join('')}
      <div class="chip-sep"></div>
      ${PRICE_BUCKETS.map(f => `<button class="chip ${price === f.id ? 'on' : ''}" data-price="${f.id}">${f.label}</button>`).join('')}
    </div>
    <div class="car-grid">
      ${cars.map(c => `
        <div class="car-card" data-car="${c.id}">
          ${artFor(c)}
          <div class="brand">${c.brand}</div>
          <div class="model">${c.model}</div>
          <div class="price">from ${fmt(minPrice(c))} <span>CAD</span></div>
          <div class="tag-row">${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
          <div class="blurb">${c.blurb}</div>
          <button class="btn btn-hot">Build it →</button>
        </div>`).join('')}
    </div>
    ${cars.length === 0 ? '<div class="empty"><div class="big">🔍</div>Nothing matches those filters. Loosen up — you have infinite money.</div>' : ''}
  </div>`;

  $$('.chip[data-body]').forEach(ch => ch.onclick = () => { Sound.click(); state.filters.body = ch.dataset.body; renderShowroom(); });
  $$('.chip[data-price]').forEach(ch => ch.onclick = () => { Sound.click(); state.filters.price = ch.dataset.price; renderShowroom(); });
  $$('.car-card').forEach(card => card.onclick = () => startBuild(card.dataset.car));
}

// --- builder ---
function startBuild(carId) {
  Sound.select();
  state.build = { carId, trim: carById(carId).trims[0].id, color: 0, wheel: 0, packages: new Set() };
  state.lastTotal = buildTotal(state.build);
  state.view = 'build';
  $$('.nav-btn').forEach(b => b.classList.remove('active'));
  renderBuild();
  scrollTo({ top: 0, behavior: 'instant' });
}

function renderBuild() {
  const b = state.build;
  const car = carById(b.carId);
  const trim = car.trims.find(t => t.id === b.trim);
  const total = buildTotal(b);

  main.innerHTML = `
  <div class="view builder">
    <div class="stage">
      <div id="stage-art" class="stage-swap">${artFor(car, b)}</div>
      <div class="car-title">${car.year} ${car.brand} ${car.model}</div>
      <div class="car-sub">${trim.name} · ${car.colors[b.color].name}</div>
      <div class="ticker-label">Your price</div>
      <div class="ticker" id="ticker">${fmt(total)}</div>
      <div class="spec-strip">
        <div class="spec"><b>${trim.hp}</b><span>hp</span></div>
        <div class="spec"><b>${trim.zero}s</b><span>0–100</span></div>
        <div class="spec"><b>${trim.dt}</b><span>drive</span></div>
        <div class="spec"><b>${trim.seats}</b><span>seats</span></div>
      </div>
    </div>
    <div class="opts">
      <div class="opt-section">
        <div class="opt-title"><span class="step-num">1</span>Trim</div>
        ${car.trims.map(t => `
          <div class="trim-card ${t.id === b.trim ? 'on' : ''}" data-trim="${t.id}">
            <div><div class="t-name">${t.name}</div>
            <div class="t-specs">${t.hp} hp · ${t.zero}s 0–100 · ${t.dt}</div></div>
            <div class="t-price">${fmt(t.price)}</div>
          </div>`).join('')}
      </div>
      <div class="opt-section">
        <div class="opt-title"><span class="step-num">2</span>Paint</div>
        <div class="color-name">${car.colors[b.color].name} ${car.colors[b.color].price ? `<span>+${fmt(car.colors[b.color].price)}</span>` : '<span>included</span>'}</div>
        <div class="swatch-row">
          ${car.colors.map((c, i) => `<div class="swatch ${i === b.color ? 'on' : ''}" data-color="${i}" style="background:${c.hex}" title="${c.name}"></div>`).join('')}
        </div>
      </div>
      <div class="opt-section">
        <div class="opt-title"><span class="step-num">3</span>Wheels</div>
        <div class="wheel-row">
          ${car.wheels.map((w, i) => `
            <div class="wheel-opt ${i === b.wheel ? 'on' : ''}" data-wheel="${i}">${w.name}
              <span class="w-price">${w.price ? '+' + fmt(w.price) : 'included'}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="opt-section">
        <div class="opt-title"><span class="step-num">4</span>Options</div>
        ${car.packages.map((p, i) => `
          <div class="pkg ${b.packages.has(i) ? 'on' : ''}" data-pkg="${i}">
            <div><div class="p-name">${p.name}</div><div class="p-desc">${p.desc}</div></div>
            <div style="display:flex;align-items:center;gap:12px">
              <span class="p-price">+${fmt(p.price)}</span>
              <span class="check">${b.packages.has(i) ? '✔' : ''}</span>
            </div>
          </div>`).join('')}
        ${car.packages.length === 0 ? '<div class="sub">No packages — it comes fully loaded.</div>' : ''}
      </div>
      <div class="finish-bar">
        <button class="btn btn-ghost" id="back-btn">← Showroom</button>
        <button class="btn btn-hot" id="finish-btn">Finish build 🎉</button>
      </div>
    </div>
  </div>`;

  const rerender = (soundFn) => {
    const newTotal = buildTotal(state.build);
    soundFn();
    renderBuild();
    const t = $('#ticker');
    animateTicker(t, state.lastTotal, newTotal);
    state.lastTotal = newTotal;
    $('#stage-art').classList.remove('stage-swap');
    void $('#stage-art').offsetWidth;
    $('#stage-art').classList.add('stage-swap');
  };

  $$('.trim-card').forEach(el => el.onclick = () => { b.trim = el.dataset.trim; rerender(Sound.select); });
  $$('.swatch').forEach(el => el.onclick = () => { b.color = +el.dataset.color; rerender(Sound.paint); });
  $$('.wheel-opt').forEach(el => el.onclick = () => { b.wheel = +el.dataset.wheel; rerender(Sound.select); });
  $$('.pkg').forEach(el => el.onclick = () => {
    const i = +el.dataset.pkg;
    b.packages.has(i) ? b.packages.delete(i) : b.packages.add(i);
    rerender(Sound.select);
  });
  $('#back-btn').onclick = () => go('showroom');
  $('#finish-btn').onclick = finishBuild;
}

function finishBuild() {
  const b = state.build;
  const car = carById(b.carId);
  const trim = car.trims.find(t => t.id === b.trim);
  const total = buildTotal(b);

  const entry = {
    id: 'b' + Date.now(),
    carId: b.carId, trim: b.trim, color: b.color, wheel: b.wheel,
    packages: [...b.packages],
    total, when: todayKey(),
  };
  store.garage = [entry, ...store.garage];
  updateGarageCount(true);
  Sound.kaching();
  Confetti.burst();

  showModal(`
    <div class="m-title">It's yours! 🏁</div>
    <div class="m-sub">Congratulations on absolutely zero dollars spent.</div>
    ${artFor(car, b)}
    <div class="m-lines">
      <div class="m-line"><span>Vehicle</span><span>${car.year} ${car.brand} ${car.model} ${trim.name}</span></div>
      <div class="m-line"><span>Paint</span><span>${car.colors[b.color].name}</span></div>
      <div class="m-line"><span>Wheels</span><span>${car.wheels[b.wheel].name}</span></div>
      ${[...b.packages].map(i => `<div class="m-line"><span>Option</span><span>${car.packages[i].name}</span></div>`).join('')}
      <div class="m-total"><span>Total</span><span>${fmt(total)}</span></div>
    </div>
    <div class="m-actions">
      <button class="btn btn-ghost" id="m-again">Build another</button>
      <button class="btn btn-hot" id="m-garage">See my garage →</button>
    </div>`);
  $('#m-again').onclick = () => { hideModal(); go('showroom'); };
  $('#m-garage').onclick = () => { hideModal(); go('garage'); };
}

// --- garage ---
function renderGarage() {
  const garage = store.garage;
  const value = garage.reduce((s, g) => s + g.total, 0);
  main.innerHTML = `
  <div class="view">
    <div class="garage-head">
      <div class="h1">My Garage 🏠</div>
      ${garage.length ? `<div class="garage-value">${garage.length} vehicle${garage.length > 1 ? 's' : ''} · collection value <b>${fmt(value)}</b></div>` : ''}
    </div>
    ${garage.length === 0 ? `
      <div class="empty">
        <div class="big">🅿️</div>
        Your garage is empty. That's illegal on this website.<br><br>
        <button class="btn btn-hot" id="empty-cta">Go build something →</button>
      </div>` : `
      <div class="car-grid">
        ${garage.map(g => {
          if (g.barn) {
            const bf = BARNFINDS.find(x => x.id === g.barnId);
            return `
            <div class="build-card">
              <div class="badge-barn">Barn find</div>
              ${Art.car({ ...bf.art, paint: bf.paint })}
              <div class="b-title">${bf.name}</div>
              <div class="b-sub">Claimed ${g.when}</div>
              <div class="b-price">est. ${fmt(bf.value)}</div>
              <div class="b-actions"><button class="btn btn-ghost" data-del="${g.id}">Remove</button></div>
            </div>`;
          }
          const car = carById(g.carId);
          const trim = car.trims.find(t => t.id === g.trim);
          return `
          <div class="build-card">
            ${artFor(car, g)}
            <div class="b-title">${car.year} ${car.brand} ${car.model}</div>
            <div class="b-sub">${trim.name} · ${car.colors[g.color].name} · built ${g.when}</div>
            <div class="b-price">${fmt(g.total)}</div>
            <div class="b-actions">
              <button class="btn btn-hot" data-rebuild="${g.id}">Reconfigure</button>
              <button class="btn btn-ghost" data-compare="${g.id}">Compare</button>
              <button class="btn btn-ghost" data-del="${g.id}">Remove</button>
            </div>
          </div>`;
        }).join('')}
      </div>`}
  </div>`;

  const cta = $('#empty-cta');
  if (cta) cta.onclick = () => go('showroom');
  $$('[data-del]').forEach(el => el.onclick = () => {
    Sound.click();
    store.garage = store.garage.filter(g => g.id !== el.dataset.del);
    updateGarageCount();
    renderGarage();
  });
  $$('[data-rebuild]').forEach(el => el.onclick = () => {
    const g = store.garage.find(x => x.id === el.dataset.rebuild);
    state.build = { carId: g.carId, trim: g.trim, color: g.color, wheel: g.wheel, packages: new Set(g.packages) };
    state.lastTotal = buildTotal(state.build);
    Sound.select();
    state.view = 'build';
    renderBuild();
    scrollTo({ top: 0, behavior: 'instant' });
  });
  $$('[data-compare]').forEach(el => el.onclick = () => {
    state.compare[0] = { kind: 'garage', buildId: el.dataset.compare };
    Sound.select();
    go('compare');
  });
}

// --- compare ---
function compareOptions() {
  const opts = [];
  for (const g of store.garage) {
    if (g.barn) continue;
    const car = carById(g.carId);
    const trim = car.trims.find(t => t.id === g.trim);
    opts.push({ key: 'garage:' + g.id, label: `🏠 My ${car.model} ${trim.name} (${fmt(g.total)})` });
  }
  for (const c of CARS) for (const t of c.trims) {
    opts.push({ key: `stock:${c.id}:${t.id}`, label: `${c.brand} ${c.model} ${t.name} (${fmt(t.price)})` });
  }
  return opts;
}

function resolveCompare(key) {
  if (!key) return null;
  const [kind, a, b] = key.split(':');
  if (kind === 'garage') {
    const g = store.garage.find(x => x.id === a);
    if (!g) return null;
    const car = carById(g.carId);
    const trim = car.trims.find(t => t.id === g.trim);
    return {
      label: `My ${car.model}`, sub: trim.name + ' (your build)',
      art: artFor(car, g), price: g.total, trim, car,
      extras: g.packages.length,
    };
  }
  const car = carById(a);
  const trim = car.trims.find(t => t.id === b);
  return { label: `${car.brand} ${car.model}`, sub: trim.name + ' (stock)', art: artFor(car), price: trim.price, trim, car, extras: 0 };
}

function renderCompare() {
  const opts = compareOptions();
  const sel = state.compare.map(c => c ? (c.kind === 'garage' ? 'garage:' + c.buildId : `stock:${c.carId}:${c.trimId}`) : '');
  const A = resolveCompare(sel[0]), B = resolveCompare(sel[1]);

  const row = (label, fa, fb, better) => {
    if (!A || !B) return '';
    const va = fa(A), vb = fb(B);
    let winA = '', winB = '';
    if (better && va !== vb) {
      const aWins = better === 'lo' ? va < vb : va > vb;
      winA = aWins ? 'win' : ''; winB = aWins ? '' : 'win';
    }
    return `<tr><td>${label}</td><td class="${winA}">${fa(A, true)}</td><td class="${winB}">${fb(B, true)}</td></tr>`;
  };

  main.innerHTML = `
  <div class="view">
    <div class="h1">Face-off ⚔️</div>
    <div class="sub">Stock trims or your own garage builds — anything can fight anything.</div>
    <div class="compare-grid">
      ${[0, 1].map(i => {
        const r = i === 0 ? A : B;
        return `
        <div class="compare-slot">
          <select data-slot="${i}">
            <option value="">— choose a car —</option>
            ${opts.map(o => `<option value="${o.key}" ${sel[i] === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          ${r ? r.art + `<div class="b-title">${r.label}</div><div class="b-sub">${r.sub}</div>` : '<div class="empty" style="padding:36px"><div class="big">🤔</div>Pick a contender</div>'}
        </div>`;
      }).join('')}
    </div>
    ${A && B ? `
    <table class="compare-table">
      <tbody>
        ${row('Price', (x, s) => s ? fmt(x.price) : x.price, (x, s) => s ? fmt(x.price) : x.price, 'lo')}
        ${row('Power', (x, s) => s ? x.trim.hp + ' hp' : x.trim.hp, (x, s) => s ? x.trim.hp + ' hp' : x.trim.hp, 'hi')}
        ${row('Torque', (x, s) => s ? x.trim.tq + ' lb-ft' : x.trim.tq, (x, s) => s ? x.trim.tq + ' lb-ft' : x.trim.tq, 'hi')}
        ${row('0–100 km/h', (x, s) => s ? x.trim.zero + ' s' : x.trim.zero, (x, s) => s ? x.trim.zero + ' s' : x.trim.zero, 'lo')}
        ${row('$ per hp', (x, s) => s ? fmt(x.price / x.trim.hp) : x.price / x.trim.hp, (x, s) => s ? fmt(x.price / x.trim.hp) : x.price / x.trim.hp, 'lo')}
        ${row('Drivetrain', (x) => x.trim.dt, (x) => x.trim.dt)}
        ${row('Seats', (x) => x.trim.seats, (x) => x.trim.seats, 'hi')}
        ${row('Body', (x) => x.car.body, (x) => x.car.body)}
        ${row('Options added', (x) => x.extras, (x) => x.extras)}
      </tbody>
    </table>` : ''}
  </div>`;

  $$('select[data-slot]').forEach(s => s.onchange = () => {
    Sound.select();
    const key = s.value;
    const i = +s.dataset.slot;
    if (!key) state.compare[i] = null;
    else {
      const [kind, a, b] = key.split(':');
      state.compare[i] = kind === 'garage' ? { kind, buildId: a } : { kind, carId: a, trimId: b };
    }
    renderCompare();
  });
}

// --- barn find ---
function renderBarn() {
  const bf = todaysBarnFind();
  const key = todayKey();
  const claims = store.claims;
  const claimed = claims[key];
  const revealed = claims[key + '_seen'];

  main.innerHTML = `
  <div class="view barn-wrap">
    <div class="h1">Barn Find of the Day 🌾</div>
    <div class="sub">One forgotten legend surfaces every day. Claim it before midnight — tomorrow it's gone forever.</div>
    <div class="barn-stage">
      <div class="tarp ${revealed ? 'off' : ''}" id="tarp">
        <div class="tarp-emoji">🛖</div>
        <div class="tarp-hint">Something's under the tarp… tap to reveal</div>
      </div>
      ${Art.car({ ...bf.art, paint: bf.paint })}
      <div class="barn-name">${bf.name}</div>
      <div class="barn-value">estimated value ${fmt(bf.value)}</div>
      <div class="barn-story">${bf.story}</div>
      ${claimed
        ? '<div class="claimed-note">✔ Claimed — it\'s in your garage</div>'
        : `<button class="btn btn-hot" id="claim-btn" ${revealed ? '' : 'style="visibility:hidden"'}>Claim it — free 🎉</button>`}
      <div class="barn-timer">NEXT BARN FIND IN <b id="barn-count">--:--:--</b></div>
    </div>
  </div>`;

  const tarp = $('#tarp');
  tarp.onclick = () => {
    tarp.classList.add('off');
    Sound.reveal();
    const c = store.claims; c[key + '_seen'] = 1; store.claims = c;
    const btn = $('#claim-btn');
    if (btn) btn.style.visibility = 'visible';
  };

  const claimBtn = $('#claim-btn');
  if (claimBtn) claimBtn.onclick = () => {
    const c = store.claims; c[key] = bf.id; store.claims = c;
    store.garage = [{ id: 'bf' + Date.now(), barn: true, barnId: bf.id, total: 0, when: key }, ...store.garage];
    updateGarageCount(true);
    Sound.kaching();
    Confetti.burst(180);
    renderBarn();
    updateBarnDot();
  };

  // countdown to midnight
  const cd = $('#barn-count');
  function tickCd() {
    if (!document.body.contains(cd)) return;
    const now = new Date();
    const mid = new Date(now); mid.setHours(24, 0, 0, 0);
    let s = Math.floor((mid - now) / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    cd.textContent = `${h}:${m}:${ss}`;
    setTimeout(tickCd, 1000);
  }
  tickCd();
}

// ---------- modal ----------
function showModal(html) {
  $('#modal').innerHTML = html;
  $('#modal-backdrop').classList.add('show');
}
function hideModal() { $('#modal-backdrop').classList.remove('show'); }
$('#modal-backdrop').addEventListener('click', e => { if (e.target === e.currentTarget) hideModal(); });

// ---------- chrome ----------
function updateGarageCount(pop) {
  const el = $('#garage-count');
  el.textContent = store.garage.length;
  if (pop) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 400); }
}
function updateBarnDot() {
  $('#barn-dot').classList.toggle('claimed', !!store.claims[todayKey()]);
}
function updateMuteBtn() { $('#mute-btn').textContent = store.muted ? '🔇' : '🔊'; }

$('#mute-btn').onclick = () => { store.muted = !store.muted; updateMuteBtn(); if (!store.muted) Sound.select(); };
$$('.nav-btn, .logo').forEach(el => el.onclick = () => go(el.dataset.view));

const renders = { showroom: renderShowroom, garage: renderGarage, compare: renderCompare, barn: renderBarn };

// ---------- boot ----------
updateGarageCount();
updateBarnDot();
updateMuteBtn();
renderShowroom();
