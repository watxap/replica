// ─── ESTADO GLOBAL ────────────────────────────────────────────────────────────

let rawData       = null;   // JSON completo
let ligaActual    = null;   // objeto liga seleccionada
let tempActual    = null;   // objeto temporada seleccionada
let userVotes     = {};     // { "ligaId/tempId/battleId": "mc1"|"mc2"|"replica" }
let activeFilter  = 'all';

// ─── COLORES POR JURADO (se reasignan al cambiar de liga si la liga los define) ──

const JURADO_COLORS = [
  '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'
];

// ─── CARGA INICIAL ────────────────────────────────────────────────────────────

async function loadData() {
  try {
    const response = await fetch('./data/battles.json');
    if (!response.ok) throw new Error('No se pudo cargar el JSON');

    rawData = await response.json();

    // Liga y temporada por defecto: la primera de cada una
    ligaActual = rawData.ligas[0];
    tempActual = ligaActual.temporadas[0];

    applyTheme(ligaActual);
    renderHeader();
    renderHero();
    renderFilterBar();
    renderBattles();

  } catch (err) {
    console.error(err);
    document.getElementById('battles-grid').innerHTML = `
      <div class="empty">
        <span class="empty-icon">ERROR</span>
        No se pudieron cargar las batallas.
      </div>
    `;
  }
}

// ─── THEMING ──────────────────────────────────────────────────────────────────

function applyTheme(liga) {
  const r = document.documentElement;
  const c = liga.colores;
  r.style.setProperty('--color-primary',     c.primario);
  r.style.setProperty('--color-secondary',   c.secundario);
  r.style.setProperty('--color-accent',      c.acento);
  r.style.setProperty('--color-header-bg',   c['fondo-header']);
  r.style.setProperty('--color-header-text', c['texto-header']);
  r.style.setProperty('--color-eyebrow',     c.eyebrow);
}

// ─── HEADER DINÁMICO ──────────────────────────────────────────────────────────

function renderHeader() {
  const header = document.querySelector('header');

  const ligaBtns = rawData.ligas.map(liga => `
    <button
      class="liga-btn ${liga.id === ligaActual.id ? 'active' : ''}"
      onclick="setLiga('${liga.id}')"
    >
      <img
        class="liga-flag"
        src="https://flagcdn.com/24x18/${liga.pais}.png"
        srcset="https://flagcdn.com/48x36/${liga.pais}.png 2x"
        width="24" height="18"
        alt="${liga.nombre}"
        draggable="false"
      />
      ${liga.abrev}
    </button>
  `).join('');

  const tempBtns = ligaActual.temporadas.map(t => `
    <button
      class="temp-btn ${t.id === tempActual.id ? 'active' : ''}"
      onclick="setTemporada('${t.id}')"
    >
      ${t.label}
    </button>
  `).join('');

  header.innerHTML = `
    <div class="header-left">
      <div class="logo">TU <span>RÉPLICA</span></div>
    </div>
    <nav class="header-nav">
      <div class="liga-selector">${ligaBtns}</div>
    </nav>
  `;
}

// ─── HERO DINÁMICO ────────────────────────────────────────────────────────────

function renderHero() {
  const eyebrow = document.querySelector('.hero-eyebrow');
  const desc    = document.querySelector('.hero p');

  if (eyebrow) eyebrow.textContent = `${ligaActual.nombre} — ${tempActual.label}`;
  if (desc)    desc.textContent    = `Votá el ganador de cada batalla según tu criterio y descubrí qué tanto coincide tu ojo con cada jurado de ${ligaActual.nombre}.`;
}

// ─── CAMBIO DE LIGA ───────────────────────────────────────────────────────────

function setLiga(ligaId) {
  const liga = rawData.ligas.find(l => l.id === ligaId);
  if (!liga) return;

  ligaActual   = liga;
  tempActual   = liga.temporadas[0];
  activeFilter = 'all';

  applyTheme(ligaActual);
  renderHeader();
  renderHero();
  renderFilterBar();
  renderBattles();
  updateCounter();
}

// ─── CAMBIO DE TEMPORADA ──────────────────────────────────────────────────────

function setTemporada(tempId) {
  const t = ligaActual.temporadas.find(x => x.id === tempId);
  if (!t) return;

  tempActual   = t;
  activeFilter = 'all';

  renderHeader();
  renderHero();
  renderFilterBar();
  renderBattles();
  updateCounter();
}

// ─── FILTRO DE JORNADAS ───────────────────────────────────────────────────────

function setFilter(val) {
  activeFilter = val;
  renderFilterBar();
  renderBattles();
}

function renderFilterBar() {
  const bar = document.getElementById('filter-bar');

  const jornadas = [...new Set(tempActual.batallas.map(b => b.jornada))];

  // Selector de temporada (solo si hay más de una)
  const tempRow = ligaActual.temporadas.length > 1
    ? `<div class="temp-selector">
        ${ligaActual.temporadas.map(t => `
          <button
            class="temp-btn ${t.id === tempActual.id ? 'active' : ''}"
            onclick="setTemporada('${t.id}')"
          >
            ${t.label}
          </button>
        `).join('')}
      </div>`
    : '';

  // Botones de jornada
  let jornadaHtml = `
    <button
      class="filter-btn ${activeFilter === 'all' ? 'active' : ''}"
      onclick="setFilter('all')"
    >
      Todas
    </button>
  `;

  jornadas.forEach(jid => {
    const j = tempActual.jornadas.find(x => x.id === jid);
    jornadaHtml += `
      <button
        class="filter-btn ${activeFilter === jid ? 'active' : ''}"
        onclick="setFilter('${jid}')"
      >
        ${j ? j.label : jid}
      </button>
    `;
  });

  bar.innerHTML = `
    ${tempRow}
    <div class="jornada-selector">${jornadaHtml}</div>
  `;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getBatallas() {
  return activeFilter === 'all'
    ? tempActual.batallas
    : tempActual.batallas.filter(b => b.jornada === activeFilter);
}

function getJornadaLabel(jid) {
  const j = tempActual.jornadas.find(x => x.id === jid);
  return j ? j.label : jid;
}

// Namespace de votos: evita colisiones entre ligas/temporadas
function voteKey(battleId) {
  return `${ligaActual.id}/${tempActual.id}/${battleId}`;
}

// ─── FONDO BATTLE CARDS ──────────────────────────────────────────────────────────────────

function initCardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');

  // Fondo negro
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rayaduras horizontales con leve variación angular
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const len = Math.random() * 120 + 10;
    const angle = (Math.random() - 0.5) * 0.12;
    const alpha = Math.random() * 0.13 + 0.02;
    const width = Math.random() * 1.0 + 0.2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Zonas más claras irregulares
  [
    { px: 0.15, py: 0.5,  rx: 180, ry: 50, a: 0.07 },
    { px: 0.65, py: 0.3,  rx: 140, ry: 40, a: 0.05 },
    { px: 0.85, py: 0.7,  rx: 100, ry: 35, a: 0.04 },
  ].forEach(({ px, py, rx, ry, a }) => {
    const cx = canvas.width * px;
    const cy = canvas.height * py;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height * (rx / ry));
    ctx.restore();
  });

  const url = canvas.toDataURL('image/png');
  document.documentElement.style.setProperty('--card-texture', `url("${url}")`);
}

initCardTexture();

// ─── RENDER DE BATALLAS ───────────────────────────────────────────────────────

function renderBattles() {
  const grid    = document.getElementById('battles-grid');
  const battles = getBatallas();

  if (!battles.length) {
    grid.innerHTML = `
      <div class="empty">
        <span class="empty-icon">FMS</span>
        No hay batallas cargadas aún.
      </div>
    `;
    return;
  }

  grid.innerHTML = battles.map(b => {
    const key   = voteKey(b.id);
    const voted = userVotes[key];

    const videoBtn = b.youtube
      ? `<button class="video-btn" onclick="openVideo('${b.id}')">▶</button>`
      : '';

    return `
      <div class="battle-card ${voted ? 'voted' : ''}" id="bc-${b.id}">

        <div style="display:flex; align-items:center; gap:10px;">
          ${videoBtn}
          <div>
            <div class="battle-meta">${getJornadaLabel(b.jornada)}</div>
            <div class="battle-name">
              ${b.mc1} <span class="vs">vs</span> ${b.mc2}
            </div>
          </div>
        </div>

        <div class="vote-buttons">

          <button
            class="vbtn vbtn-mc ${voted === 'mc1' ? 'selected' : ''}"
            onclick="castVote('${b.id}','mc1',this)"
          >
            <img class="vbtn-portrait vbtn-portrait--left"
              src="img/${(b.mc1img || b.mc1.toLowerCase().replace(/ /g,'-'))}.webp" alt="${b.mc1}"
              onerror="this.style.display='none'">
            ${b.mc1.split(' ')[0].toUpperCase()}
          </button>

          <button
            class="vbtn vbtn-mc ${voted === 'replica' ? 'selected-replica' : ''}"
            onclick="castVote('${b.id}','replica',this)"
          >
            <img class="vbtn-portrait vbtn-portrait--replica"
              src="img/replica.webp" alt="Réplica"
              onerror="this.style.display='none'">
            RÉPLICA
          </button>

          <button
            class="vbtn vbtn-mc ${voted === 'mc2' ? 'selected' : ''}"
            onclick="castVote('${b.id}','mc2',this)"
          >
            <img class="vbtn-portrait vbtn-portrait--right"
              src="img/${(b.mc2img || b.mc2.toLowerCase().replace(/ /g,'-'))}.webp" alt="${b.mc2}"
              onerror="this.style.display='none'">
            ${b.mc2.split(' ')[0].toUpperCase()}
          </button>

        </div>
      </div>
    `;
  }).join('');

  updateCounter();
}

// ─── VOTOS ────────────────────────────────────────────────────────────────────

function castVote(battleId, choice, btn) {
  const key  = voteKey(battleId);
  const card = document.getElementById('bc-' + battleId);

  // Toggle: si ya estaba seleccionado, deseleccionar
  if (userVotes[key] === choice) {
    delete userVotes[key];
    card.classList.remove('voted');
    btn.classList.remove('selected', 'selected-replica');
    updateCounter();
    return;
  }

  userVotes[key] = choice;
  card.classList.add('voted');

  card.querySelectorAll('.vbtn').forEach(b =>
    b.classList.remove('selected', 'selected-replica')
  );

  btn.classList.add(choice === 'replica' ? 'selected-replica' : 'selected');

  updateCounter();
}

function updateCounter() {
  // Solo cuenta los votos de la liga/temporada activa
  const prefix = `${ligaActual.id}/${tempActual.id}/`;
  const count  = Object.keys(userVotes).filter(k => k.startsWith(prefix)).length;

  document.getElementById('vote-count').textContent = count;

  const bar = document.getElementById('bottom-bar');
  bar.classList.toggle('visible', count > 0);

  document.getElementById('calc-btn').disabled = count < 2;
}

// ─── RESULTADOS ───────────────────────────────────────────────────────────────

function showResults() {
  const prefix  = `${ligaActual.id}/${tempActual.id}/`;
  const votedKeys = Object.keys(userVotes).filter(k => k.startsWith(prefix));

  if (votedKeys.length < 2) return;

  const totals = {};
  tempActual.jurados.forEach(j => { totals[j.id] = 0; });

  votedKeys.forEach(key => {
    const battleId = key.replace(prefix, '');
    const battle   = tempActual.batallas.find(b => b.id === battleId);
    if (!battle) return;

    tempActual.jurados.forEach(j => {
      if (battle.votes && battle.votes[j.id] === userVotes[key]) {
        totals[j.id]++;
      }
    });
  });

  const n = votedKeys.length;

  const sorted = tempActual.jurados
    .map((j, i) => ({
      ...j,
      pct:   Math.round((totals[j.id] / n) * 100),
      color: JURADO_COLORS[i % JURADO_COLORS.length]
    }))
    .sort((a, b) => b.pct - a.pct);

  const top = sorted[0];

  document.getElementById('res-top-name').textContent = top.name;
  document.getElementById('res-sub').textContent =
    `Tu criterio coincide más con ${top.name} (${top.pct}% de acuerdo en ${n} batallas).`;

  document.getElementById('results-list').innerHTML = sorted.map((j, i) => `
    <div class="result-row">
      <div class="result-rank ${i === 0 ? 'top' : ''}">${i + 1}</div>
      <div class="result-avatar ${i === 0 ? 'top' : ''} ${i === 0 && top.pct === 100 ? 'perfect' : ''}">
      <img src="img/${j.id}.webp" alt="${j.name}" onerror="this.style.display='none'">
      <span>${j.initials}</span>
      </div>
      <div class="result-info">
        <div class="result-name ${i === 0 ? 'top' : ''}">${j.name}</div>
        <div class="result-bar-wrap">
          <div class="result-bar-fill" style="
            width: ${j.pct}%;
            background: ${i === 0 ? 'var(--color-primary)' : j.color};
          "></div>
        </div>
      </div>
      <div class="result-pct ${i === 0 ? 'top' : ''}">${j.pct}%</div>
    </div>
  `).join('');

  document.getElementById('results-modal').classList.add('open');
}

// ─── RESET ────────────────────────────────────────────────────────────────────

function resetAll() {
  // Solo borra votos de la liga/temporada activa
  const prefix = `${ligaActual.id}/${tempActual.id}/`;
  Object.keys(userVotes).forEach(k => {
    if (k.startsWith(prefix)) delete userVotes[k];
  });

  document.getElementById('results-modal').classList.remove('open');
  renderBattles();
}

// ─── MODALES ──────────────────────────────────────────────────────────────────

function closeResults(e) {
  if (!e || e.target === document.getElementById('results-modal')) {
    document.getElementById('results-modal').classList.remove('open');
  }
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function openVideo(battleId) {
  const battle = tempActual.batallas.find(b => b.id === battleId);
  if (!battle || !battle.youtube) return;

  const vid = getYouTubeId(battle.youtube);
  if (!vid) return;

  document.getElementById('video-title').innerHTML =
    `${battle.mc1}<span class="vs">vs</span>${battle.mc2}`;
  document.getElementById('video-iframe').src =
    `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
  document.getElementById('video-overlay').classList.add('open');
}

function closeVideo(e) {
  if (e && e.target !== document.getElementById('video-overlay')) return;
  closeVideoPanel();
}

function closeVideoPanel() {
  document.getElementById('video-overlay').classList.remove('open');
  document.getElementById('video-iframe').src = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeVideoPanel();
});

// ─── HIDE / SHOW HEADER ON SCROLL ─────────────────────────────────────────────

(function () {
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    const header   = document.querySelector('header');

    if (currentY > lastY && currentY > 80) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }

    lastY = currentY;
  }, { passive: true });
})();

// ─── GLITCH TITLE ─────────────────────────────────────────────────────────────

(function () {
  const el = document.getElementById('glitch-title');
  if (!el) return;
  let busy = false;

  function fire() {
    if (busy) return;
    busy = true;
    el.classList.add('go');
    setTimeout(() => { el.classList.remove('go'); busy = false; }, 170);
  }

  fire();
  setInterval(fire, 4700);
})();

// ─── ARRANQUE ─────────────────────────────────────────────────────────────────

loadData();