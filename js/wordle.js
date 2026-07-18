// ============================================================
//  MAP QUIZ — GeoWordle (modo país del día)
// ============================================================

const WORDLE_MAX_INTENTOS = 4;
const WORDLE_STORAGE_KEY  = 'mq_wordle_estado';
const WORDLE_STATS_KEY    = 'mq_wordle_stats';

// Estado del wordle en esta sesión
let wordleEstado = null;

// ── UTILIDAD: clave del día en UTC (YYYY-MM-DD) ──────────────
function diaKey() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── PAÍS DEL DÍA (rota cada 24h exactas en UTC) ──────────────
function getPaisDelDia() {
  const inicio    = Date.UTC(2025, 0, 1); // 2025-01-01 00:00 UTC
  const diasDesde = Math.floor((Date.now() - inicio) / 86400000);
  const pool = PAISES.filter(p => p.nombre);
  return pool[diasDesde % pool.length];
}

// ── STATS PERSISTENTES ───────────────────────────────────────
function getWordleStats() {
  const raw = localStorage.getItem(WORDLE_STATS_KEY);
  return raw ? JSON.parse(raw) : {
    jugados: 0,
    ganados: 0,
    rachaActual: 0,
    rachaMaxima: 0,
    ultimoDia: null,
  };
}

function guardarWordleStats(stats) {
  localStorage.setItem(WORDLE_STATS_KEY, JSON.stringify(stats));
}

function actualizarWordleStats(gano) {
  const stats = getWordleStats();
  const hoy   = diaKey();

  stats.jugados++;
  if (gano) {
    stats.ganados++;
    // Continúa racha solo si ayer también jugó o es el primer día
    const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (stats.ultimoDia === ayer || stats.ultimoDia === null) {
      stats.rachaActual++;
    } else {
      stats.rachaActual = 1;
    }
    if (stats.rachaActual > stats.rachaMaxima) {
      stats.rachaMaxima = stats.rachaActual;
    }
  } else {
    stats.rachaActual = 0;
  }
  stats.ultimoDia = hoy;
  guardarWordleStats(stats);
  return stats;
}

// ── ESTADO GUARDADO DEL DÍA ──────────────────────────────────
function cargarEstadoDia() {
  const raw = localStorage.getItem(WORDLE_STORAGE_KEY);
  if (!raw) return null;
  const estado = JSON.parse(raw);
  // Si es de otro día, descartar
  if (estado.dia !== diaKey()) return null;
  return estado;
}

function guardarEstadoDia() {
  localStorage.setItem(WORDLE_STORAGE_KEY, JSON.stringify(wordleEstado));
}

// ── REGIÓN LABEL ─────────────────────────────────────────────
function getRegionLabel(region) {
  const map = {
    america_norte: 'América del Norte',
    america_sur:   'América del Sur',
    europa:        'Europa',
    asia:          'Asia',
    africa:        'África',
    oceania:       'Oceanía',
  };
  return map[region] || region;
}

// ── RANGO DE POBLACIÓN ───────────────────────────────────────
function getPoblacionRango(n) {
  if (n < 500_000)        return 'menos de 500 mil hab.';
  if (n < 1_000_000)      return 'entre 500 mil y 1 millón hab.';
  if (n < 5_000_000)      return 'entre 1 y 5 millones hab.';
  if (n < 10_000_000)     return 'entre 5 y 10 millones hab.';
  if (n < 50_000_000)     return 'entre 10 y 50 millones hab.';
  if (n < 100_000_000)    return 'entre 50 y 100 millones hab.';
  if (n < 500_000_000)    return 'entre 100 y 500 millones hab.';
  return 'más de 500 millones hab.';
}

// ── RENDER DE PISTAS ─────────────────────────────────────────
function renderPistas() {
  const pais      = getPaisDelDia();
  const fallados  = wordleEstado.intentosFallados;

  // Pista 0 — Continente: siempre visible
  document.getElementById('pista-val-continente').textContent = getRegionLabel(pais.region);
  document.getElementById('pista-continente').classList.add('visible');

  // Pista 1 — Población: tras 1er fallo
  if (fallados >= 1) {
    document.getElementById('pista-val-poblacion').textContent = getPoblacionRango(pais.poblacion);
    document.getElementById('pista-poblacion').classList.add('visible');
  }

  // Pista 2 — Capital: tras 2do fallo
  if (fallados >= 2) {
    document.getElementById('pista-val-capital').textContent = pais.capital;
    document.getElementById('pista-capital').classList.add('visible');
  }

  // Pista 3 — Vecinos: tras 3er fallo
  if (fallados >= 3) {
    const vecinos = (VECINOS[pais.nombre] || []);
    const texto   = vecinos.length > 0
      ? vecinos.slice(0, 4).join(', ') + (vecinos.length > 4 ? '…' : '')
      : 'Ninguno (país insular)';
    document.getElementById('pista-val-vecinos').textContent = texto;
    document.getElementById('pista-vecinos').classList.add('visible');
  }
}

// ── RENDER DE DOTS (intentos) ────────────────────────────────
function renderDots() {
  const dots    = document.querySelectorAll('.wordle-dot');
  const fallados = wordleEstado.intentosFallados;
  const restantes = WORDLE_MAX_INTENTOS - fallados;

  dots.forEach((dot, i) => {
    dot.classList.remove('usado', 'vacio');
    if (i < fallados) {
      dot.classList.add('usado');         // rojo = intento gastado
    } else if (i >= restantes + fallados) {
      dot.classList.add('vacio');         // gris = nunca usado
    }
    // verde = disponible (sin clase)
  });

  const label = restantes === 1
    ? '1 intento restante'
    : `${restantes} intentos restantes`;
  document.getElementById('wordle-intentos-label').textContent = label;
}

// ── RENDER DE HISTORIAL ──────────────────────────────────────
function renderHistorial() {
  const cont = document.getElementById('wordle-historial');
  cont.innerHTML = '';
  wordleEstado.intentosNombres.forEach(nombre => {
    const pais = PAISES.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    const code = pais ? pais.code : null;
    const item = document.createElement('div');
    item.className = 'wordle-intento-item';
    item.innerHTML = `
      ${code
        ? `<img class="wordle-intento-flag" src="https://flagcdn.com/w40/${code}.png" alt="${nombre}">`
        : '<span style="width:32px"></span>'}
      <span class="wordle-intento-nombre">${nombre}</span>
      <span class="wordle-intento-badge">✗ Incorrecto</span>
    `;
    cont.appendChild(item);
  });
}

// ── AUTOCOMPLETE ─────────────────────────────────────────────
let acIndex = -1;

function renderAutocomplete(query) {
  const lista = document.getElementById('wordle-autocomplete');
  acIndex = -1;
  if (!query || query.length < 1) {
    lista.innerHTML = '';
    lista.classList.remove('open');
    return;
  }
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const matches = PAISES.filter(p => {
    const nombre = p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return nombre.startsWith(q);
  }).slice(0, 8);

  if (matches.length === 0) {
    lista.innerHTML = '';
    lista.classList.remove('open');
    return;
  }

  lista.innerHTML = '';
  matches.forEach((p, i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.nombre = p.nombre;
    li.innerHTML = `
      <img src="https://flagcdn.com/w40/${p.code}.png" alt="" aria-hidden="true">
      ${p.nombre}
    `;
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      seleccionarSugerencia(p.nombre);
    });
    lista.appendChild(li);
  });
  lista.classList.add('open');
}

function seleccionarSugerencia(nombre) {
  document.getElementById('wordle-input').value = nombre;
  document.getElementById('wordle-autocomplete').classList.remove('open');
  acIndex = -1;
}

function navegarAutocomplete(dir) {
  const items = document.querySelectorAll('#wordle-autocomplete li');
  if (!items.length) return;
  items[acIndex]?.classList.remove('active');
  acIndex = (acIndex + dir + items.length) % items.length;
  items[acIndex].classList.add('active');
  document.getElementById('wordle-input').value = items[acIndex].dataset.nombre;
}

// ── LÓGICA DE ADIVINAR ───────────────────────────────────────
function procesarIntento() {
  if (wordleEstado.terminado) return;

  const input     = document.getElementById('wordle-input');
  const guess     = input.value.trim();
  const paisDelDia = getPaisDelDia();

  // Validar que sea un país real de la lista
  const paisGuess = PAISES.find(p =>
    p.nombre.toLowerCase() === guess.toLowerCase()
  );

  if (!guess || !paisGuess) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 450);
    mostrarToast('Escribe un país válido de la lista', 'wrong', 1800);
    return;
  }

  // ¿Ya lo intentó antes?
  if (wordleEstado.intentosNombres.some(n => n.toLowerCase() === guess.toLowerCase())) {
    mostrarToast('Ya intentaste ese país', 'wrong', 1500);
    input.value = '';
    return;
  }

  // ¿Acertó?
  if (paisGuess.nombre === paisDelDia.nombre) {
    wordleEstado.terminado = true;
    wordleEstado.gano      = true;
    guardarEstadoDia();
    const stats = actualizarWordleStats(true);
    playVictorySound?.();
    setTimeout(() => mostrarResultadoWordle(true, stats), 400);
    return;
  }

  // Falló
  wordleEstado.intentosFallados++;
  wordleEstado.intentosNombres.push(paisGuess.nombre);
  input.value = '';
  document.getElementById('wordle-autocomplete').classList.remove('open');

  renderDots();
  renderHistorial();

  // Revelar siguiente pista con delay para que se vea el historial primero
  setTimeout(() => renderPistas(), 300);

  guardarEstadoDia();

  // ¿Se acabaron los intentos?
  if (wordleEstado.intentosFallados >= WORDLE_MAX_INTENTOS) {
    wordleEstado.terminado = true;
    wordleEstado.gano      = false;
    guardarEstadoDia();
    const stats = actualizarWordleStats(false);
    playDefeatSound?.();
    setTimeout(() => mostrarResultadoWordle(false, stats), 600);
  }
}

// ── MOSTRAR RESULTADO FINAL ──────────────────────────────────
function mostrarResultadoWordle(gano, stats) {
  const pais = getPaisDelDia();

  // Ocultar input
  document.getElementById('wordle-input-section').style.display = 'none';

  // Mostrar panel resultado
  const res = document.getElementById('wordle-resultado');
  res.style.display = 'flex';

  if (gano) {
    document.getElementById('wordle-res-emoji').textContent   = '🎉';
    document.getElementById('wordle-res-titulo').textContent  = '¡Lo adivinaste!';
    const intento = wordleEstado.intentosFallados + 1;
    document.getElementById('wordle-res-sub').textContent =
      `Lo lograste en ${intento} ${intento === 1 ? 'intento' : 'intentos'}`;
    if (typeof confetti !== 'undefined') {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  } else {
    document.getElementById('wordle-res-emoji').textContent   = '😔';
    document.getElementById('wordle-res-titulo').textContent  = `Era ${pais.nombre}`;
    document.getElementById('wordle-res-sub').textContent     = 'Mañana habrá un nuevo país. ¡Vuelve a intentarlo!';
  }

  // Bandera del país revelado
  document.getElementById('wordle-res-bandera').src = `https://flagcdn.com/w160/${pais.code}.png`;
  document.getElementById('wordle-res-bandera').alt = pais.nombre;

  // Stats
  const pct = stats.jugados > 0
    ? Math.round((stats.ganados / stats.jugados) * 100) + '%'
    : '0%';
  document.getElementById('wstat-jugados').textContent  = stats.jugados;
  document.getElementById('wstat-ganados').textContent  = pct;
  document.getElementById('wstat-racha').textContent    = stats.rachaActual;
  document.getElementById('wstat-max').textContent      = stats.rachaMaxima;

  // Countdown al día siguiente
  iniciarCountdown();
}

// ── COUNTDOWN AL PRÓXIMO DÍA ─────────────────────────────────
function iniciarCountdown() {
  let intervalId;
  const actualizar = () => {
    const ahora   = Date.now();
    // Próxima medianoche UTC (misma referencia que el cambio de país)
    const msSinceEpoch = ahora;
    const msEnDia = 86400000;
    const mananaUTC = Math.ceil(msSinceEpoch / msEnDia) * msEnDia;
    const diff    = mananaUTC - ahora;
    const hh      = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const mm      = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const ss      = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    const el      = document.getElementById('wordle-countdown');
    if (el) el.textContent = `${hh}:${mm}:${ss}`;
  };
  actualizar();
  intervalId = setInterval(actualizar, 1000);
  // Limpiar al salir
  document.getElementById('btn-salir-wordle').addEventListener('click', () => {
    clearInterval(intervalId);
  }, { once: true });
}

// ── MOSTRAR STATS (botón 📊) ──────────────────────────────────
function mostrarWordleStats() {
  const stats = getWordleStats();
  const pct   = stats.jugados > 0
    ? Math.round((stats.ganados / stats.jugados) * 100)
    : 0;
  mostrarToast(
    `🎮 ${stats.jugados} jugados · ✅ ${pct}% ganados · 🔥 Racha: ${stats.rachaActual}`,
    'correct',
    3500
  );
}

// ── INICIALIZAR PANTALLA WORDLE ───────────────────────────────
function inicializarWordle() {
  const pais = getPaisDelDia();

  // Resetear UI
  document.querySelectorAll('.pista-card').forEach(c => c.classList.remove('visible'));
  document.getElementById('wordle-historial').innerHTML = '';
  document.getElementById('wordle-resultado').style.display  = 'none';
  document.getElementById('wordle-input-section').style.display = 'block';
  document.getElementById('wordle-input').value = '';
  document.getElementById('wordle-autocomplete').classList.remove('open');
  document.getElementById('wordle-autocomplete').innerHTML = '';

  // Cargar estado del día (o crear nuevo)
  const estadoGuardado = cargarEstadoDia();
  if (estadoGuardado) {
    wordleEstado = estadoGuardado;
  } else {
    wordleEstado = {
      dia:               diaKey(),
      paisId:            pais.id,
      intentosFallados:  0,
      intentosNombres:   [],
      terminado:         false,
      gano:              false,
    };
  }

  // Render inicial
  renderDots();
  renderPistas();
  renderHistorial();

  // Si ya terminó hoy, mostrar resultado directamente
  if (wordleEstado.terminado) {
    document.getElementById('wordle-input-section').style.display = 'none';
    const stats = getWordleStats();
    mostrarResultadoWordle(wordleEstado.gano, stats);
  }
}

// ── REGISTRAR LISTENERS DEL WORDLE (una sola vez) ────────────
function inicializarWordleListeners() {
  const input    = document.getElementById('wordle-input');
  const btnAdiv  = document.getElementById('btn-wordle-adivinar');
  const btnSalir = document.getElementById('btn-salir-wordle');
  const btnStats = document.getElementById('btn-wordle-stats');

  // Botón adivinar
  btnAdiv.addEventListener('click', procesarIntento);

  // Enter en el input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (document.getElementById('wordle-autocomplete').classList.contains('open') && acIndex >= 0) {
        // Si hay sugerencia seleccionada con teclado, usarla
        const items = document.querySelectorAll('#wordle-autocomplete li');
        if (items[acIndex]) seleccionarSugerencia(items[acIndex].dataset.nombre);
      } else {
        procesarIntento();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navegarAutocomplete(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navegarAutocomplete(-1);
    } else if (e.key === 'Escape') {
      document.getElementById('wordle-autocomplete').classList.remove('open');
    }
  });

  // Autocomplete en tiempo real
  input.addEventListener('input', () => {
    renderAutocomplete(input.value.trim());
  });

  // Cerrar autocomplete al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.wordle-input-section')) {
      document.getElementById('wordle-autocomplete').classList.remove('open');
    }
  });

  // Botón salir
  btnSalir.addEventListener('click', () => {
    abrirMenu();
  });

  // Botón stats
  btnStats.addEventListener('click', mostrarWordleStats);
}

// ── RESET DE EMERGENCIA (si el estado guardado es de otro sistema) ──
function resetearWordleSiNecesario() {
  const raw = localStorage.getItem(WORDLE_STORAGE_KEY);
  if (!raw) return;
  try {
    const estado = JSON.parse(raw);
    // Si el dia guardado no coincide con hoy en UTC, borrar
    if (estado.dia !== diaKey()) {
      localStorage.removeItem(WORDLE_STORAGE_KEY);
    }
  } catch(e) {
    localStorage.removeItem(WORDLE_STORAGE_KEY);
  }
}

// ── ABRIR WORDLE (llamado desde main.js) ─────────────────────
function abrirWordle() {
  resetearWordleSiNecesario();
  mostrarScreen('wordle');
  inicializarWordle();
}
