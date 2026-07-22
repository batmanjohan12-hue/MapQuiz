// ============================================================
//  MAP QUIZ — Controlador principal de la aplicación
// ============================================================

// ── Estado global ─────────────────────────────────────────
let juegoActual    = null;
let modoSeleccionado   = 'banderas';
let regionSeleccionada = 'mundo';
let formatoSeleccionado = 'clasico';
let nombreJugador  = '';
let puntajeGuardado = false;

// ── Referencia a elementos DOM ─────────────────────────────
const $ = id => document.getElementById(id);

// screens se inicializa en DOMContentLoaded cuando el DOM ya existe
let screens = {};

function abrirMenu() {
  refrescarMenu();
  mostrarScreen('menu');
}

// ── SONIDOS (Archivos Reales) ─────────────────────────────────
let soundMuted = localStorage.getItem('mq_muted') === 'true';

const sounds = {
  correct: new Audio('https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3'),
  wrong:   new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'),
  tick:    new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
  timeout: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
  victory: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
  defeat:  new Audio('https://assets.mixkit.co/active_storage/sfx/3144/3144-preview.mp3')
};

// Configurar volúmenes
sounds.tick.volume = 1.0;
sounds.correct.volume = 0.5;
sounds.wrong.volume = 0.5;
sounds.timeout.volume = 0.4;
sounds.victory.volume = 0.4;
sounds.defeat.volume = 0.25;

function playSound(type) {
  if (soundMuted) return;
  try {
    const audio = sounds[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
    }
  } catch(e) {}
}

function playCorrectSound() { playSound('correct'); }
function playWrongSound() { playSound('wrong'); }
function playWarningSound() { playSound('tick'); }
function playVictorySound() { playSound('victory'); }
function playDefeatSound() { playSound('defeat'); }

function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.setItem('mq_muted', soundMuted);
  actualizarMuteUI();
}

function actualizarMuteUI() {
  const btns = [$('btn-mute'), $('btn-mute-game')];
  btns.forEach(btn => {
    if (btn) {
      btn.textContent = soundMuted ? '🔇' : '🔊';
      btn.classList.toggle('muted', soundMuted);
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NAVEGACIÓN ENTRE PANTALLAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function mostrarScreen(nombre) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[nombre].classList.add('active');
  window.scrollTo(0, 0);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MENÚ PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let curiosidadInterval;

function inicializarPanelesLaterales() {


  // 1. Curiosidades
  const rotarCuriosidad = () => {
    if (CURIOSIDADES && CURIOSIDADES.length > 0) {
      const idx = Math.floor(Math.random() * CURIOSIDADES.length);
      $('curiosidad-texto').textContent = `"${CURIOSIDADES[idx]}"`;
    }
  };
  rotarCuriosidad();
  if (curiosidadInterval) clearInterval(curiosidadInterval);
  curiosidadInterval = setInterval(rotarCuriosidad, 8000);

  // 2. País del Día
  const paises = PAISES.filter(p => p.region !== 'Global');
  if (paises.length > 0) {
    // Usamos el día del año como semilla para que cambie cada día (o aleatorio simple)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const pd = paises[dayOfYear % paises.length];
    
    $('pd-bandera').src = `https://flagcdn.com/w160/${pd.code}.png`;
    $('pd-nombre').textContent = pd.nombre;
    $('pd-capital').textContent = `🏙️ ${pd.capital}`;
    $('pd-poblacion').textContent = `👥 ${(pd.poblacion / 1000000).toFixed(1)} M hab.`;
  }

  // 3. Mini Ranking — sincronizado con la misma fuente que la tabla de clasificación
  const list = $('mini-ranking-list');
  list.innerHTML = `<div style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:8px 0;">⏳ Cargando...</div>`;
  obtenerRankingAsync().then(datos => {
    list.innerHTML = '';
    const top3 = datos.slice(0, 3);
    if (top3.length === 0) {
      list.innerHTML = `<div style="color:var(--text-muted);font-size:.9rem;text-align:center;padding:10px 0;">Nadie ha jugado aún. ¡Sé el primero!</div>`;
    } else {
      top3.forEach((entry, i) => {
        const posLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
        list.innerHTML += `
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-2);padding:8px 12px;border-radius:var(--r-sm);">
            <div style="display:flex;gap:8px;align-items:center;">
              <span style="font-size:1.1rem;">${posLabel}</span>
              <span style="font-weight:600;font-size:.95rem;">${entry.nombre}</span>
            </div>
            <span style="font-family:var(--ff-head);font-weight:700;color:var(--accent);">${entry.puntaje.toLocaleString('es-ES')} pts</span>
          </div>
        `;
      });
    }
  });
}

/** Renderiza las estadísticas rápidas en el menú. */
function actualizarQuickStats() {
  const stats = obtenerEstadisticas();
  $('qs-partidas').textContent  = stats.totalPartidas;
  $('qs-aciertos').textContent  = stats.totalAciertos;
  $('qs-best').textContent      = stats.mejorPuntaje.toLocaleString('es-ES');
  $('qs-racha').textContent     = stats.rachaMaxima;
}

/** Actualiza el widget de progreso por región en la columna izquierda. */
function actualizarProgresoRegiones() {
  const stats    = obtenerEstadisticas();
  const container = $('region-progress-list');
  if (!container) return;

  const regiones = [
    { id: 'america_norte', emoji: '🌎', label: 'América del Norte' },
    { id: 'america_sur',   emoji: '🌎', label: 'América del Sur'   },
    { id: 'europa',        emoji: '🌍', label: 'Europa'            },
    { id: 'asia',          emoji: '🌏', label: 'Asia'              },
    { id: 'africa',        emoji: '🌍', label: 'África'            },
    { id: 'oceania',       emoji: '🌏', label: 'Oceanía'           },
  ];

  container.innerHTML = '';
  regiones.forEach(r => {
    // Calcular % de aciertos en esta región desde stats por región
    const regionStats = stats.porRegion?.[r.id];
    const aciertos    = regionStats?.aciertos  || 0;
    const total       = regionStats?.total      || 0;
    const pct         = total > 0 ? Math.round((aciertos / total) * 100) : 0;

    const item = document.createElement('div');
    item.className = 'region-progress-item';
    item.innerHTML = `
      <div class="region-progress-header">
        <span class="region-progress-name">${r.emoji} ${r.label}</span>
        <span class="region-progress-pct">${pct > 0 ? pct + '%' : '—'}</span>
      </div>
      <div class="region-progress-bar-track">
        <div class="region-progress-bar-fill" style="width:${pct}%"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

/** Actualiza el widget de racha del GeoWordle en la columna izquierda. */
function actualizarWordleWidget() {
  const stats = typeof getWordleStats === 'function' ? getWordleStats() : null;
  if (!stats) return;

  const elRacha   = $('ww-racha');
  const elMax     = $('ww-max');
  const elJugados = $('ww-jugados');
  const elGanados = $('ww-ganados');
  const elHoy     = $('ww-estado-hoy');

  if (elRacha)   elRacha.textContent   = stats.rachaActual;
  if (elMax)     elMax.textContent     = stats.rachaMaxima;
  if (elJugados) elJugados.textContent = stats.jugados;
  if (elGanados) elGanados.textContent = stats.jugados > 0
    ? Math.round((stats.ganados / stats.jugados) * 100) + '%'
    : '0%';

  if (elHoy) {
    // Ver si ya jugó hoy
    const WORDLE_STORAGE_KEY = 'mq_wordle_estado';
    const raw = localStorage.getItem(WORDLE_STORAGE_KEY);
    const hoyUTC = new Date().toISOString().slice(0, 10);
    let jugadoHoy = false;
    let ganoHoy   = false;
    if (raw) {
      try {
        const estado = JSON.parse(raw);
        if (estado.dia === hoyUTC && estado.terminado) {
          jugadoHoy = true;
          ganoHoy   = estado.gano;
        }
      } catch(e) {}
    }

    if (jugadoHoy) {
      elHoy.className  = 'wordle-jugado-hoy jugado';
      elHoy.textContent = ganoHoy ? t('played_won') : t('played_lost');
      elHoy.style.cursor = 'default';
    } else {
      elHoy.className  = 'wordle-jugado-hoy pendiente';
      elHoy.textContent = t('play_today');
      elHoy.onclick = () => {
        if (typeof abrirWordle === 'function') abrirWordle();
      };
    }
  }
}

/** Refresca solo la UI del menú, sin registrar listeners nuevos. */
function refrescarMenu() {
  actualizarQuickStats();
  actualizarProgresoRegiones();
  actualizarWordleWidget();
  document.querySelectorAll('.region-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.region === regionSeleccionada);
  });
  document.querySelectorAll('.modo-card').forEach(c => {
    c.classList.remove('selected');
    c.querySelectorAll('.formato-pill').forEach(p => p.classList.remove('active'));
  });
}

/** Alias de compatibilidad. */
function inicializarMenu() { refrescarMenu(); }

/** Registra todos los listeners del menú UNA SOLA VEZ. */
function inicializarMenuListeners() {
  document.querySelectorAll('.modo-card').forEach(card => {
    // Ignorar la card especial de idiomas
    if (card.id === 'modo-idiomas') return;
    const mainRow = card.querySelector('.modo-card-main');
    if (!mainRow) return;
    mainRow.addEventListener('click', () => {
      const yaSeleccionada = card.classList.contains('selected');
      document.querySelectorAll('.modo-card').forEach(c => c.classList.remove('selected'));
      if (!yaSeleccionada) {
        card.classList.add('selected');
        modoSeleccionado = card.dataset.modo;
      }
    });
    card.querySelectorAll('.formato-pill').forEach(pill => {
      pill.addEventListener('click', e => {
        e.stopPropagation();
        formatoSeleccionado = pill.dataset.formato;
        const paises = getPaisesPorRegion(regionSeleccionada);
        if (paises.length < 4) {
          mostrarToast('No hay suficientes países en esta región', 'wrong', 2500);
          return;
        }
        card.querySelectorAll('.formato-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        setTimeout(() => iniciarJuego(modoSeleccionado, regionSeleccionada), 180);
      });
    });
  });

  document.querySelectorAll('.region-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const region = pill.dataset.region;
      const count  = getPaisesPorRegion(region).length;
      if (count < 4) {
        mostrarToast(`¡Solo hay ${count} países en esa región!`, 'wrong', 2000);
        return;
      }
      document.querySelectorAll('.region-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      regionSeleccionada = region;
    });
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LÓGICA DE JUEGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Limpia TODOS los timers y sonidos del juego en curso antes de navegar. */
function detenerJuegoActual() {
  // Detener juego principal
  if (juegoActual) {
    juegoActual.detenerTimer();
    juegoActual = null;
  }
  // Detener juego de idiomas si estaba activo
  if (typeof idiomasJuego !== 'undefined' && idiomasJuego) {
    idiomasJuego.detenerTimer();
    idiomasJuego = null;
  }
  // Detener audio TTS
  if (typeof detenerAudio === 'function') detenerAudio();
  // Detener tick
  if (sounds.tick) {
    sounds.tick.pause();
    sounds.tick.currentTime = 0;
  }
  // Resetear barra de timer
  const fill  = $('timer-fill');
  const numEl = $('timer-num');
  if (fill)  { fill.style.width = '100%'; fill.classList.remove('medium', 'low'); }
  if (numEl) { numEl.textContent = CONFIG.TIEMPO_POR_PREGUNTA; numEl.classList.remove('low'); }
  // Resetear barra de progreso
  const progFill  = $('progress-fill');
  const progLabel = $('progress-label');
  if (progFill)  progFill.style.width = '0%';
  if (progLabel) progLabel.textContent = '0 / 10';
}

function iniciarJuego(modo, region) {
  detenerJuegoActual(); // <-- limpiar juego anterior
  juegoActual = new MapQuizGame(modo, region, formatoSeleccionado);
  puntajeGuardado = false;
  mostrarScreen('game');
  actualizarHUD();
  siguientePregunta();
}

function siguientePregunta() {
  if (juegoActual.terminado) {
    setTimeout(mostrarResultados, 600);
    return;
  }

  const pregunta = juegoActual.generarPregunta();
  renderizarPregunta(pregunta);
  actualizarProgreso();

  juegoActual.iniciarTimer(
    (seg) => actualizarTimer(seg),
    ()    => { onTiempoAgotado(); }
  );
}

/** Renderiza la pregunta actual en pantalla. */
function renderizarPregunta(pregunta) {
  const area = $('game-area-content');
  area.innerHTML = '';
  area.style.animation = 'none';
  void area.offsetWidth; // reflow para reiniciar animación
  area.style.animation = '';

  // Tarjeta de pregunta
  const card = document.createElement('div');
  card.className = 'question-card';

  const badgeText = juegoActual.formato === 'clasico'
    ? `Pregunta ${juegoActual.preguntaActual + 1} de ${juegoActual.totalPreguntas}`
    : `Pregunta ${juegoActual.preguntaActual + 1}`;
  const badge = `<p class="q-badge">${badgeText}</p>`;
  const texto = `<p class="q-text">${pregunta.texto}</p>`;
  let displayHTML = '';

  if (pregunta.tipo !== 'poblacion' && pregunta.tipo !== 'banderas_inverso' && pregunta.display) {
    displayHTML = `<div class="q-display"><img src="https://flagcdn.com/w160/${pregunta.display}.png" alt="Bandera" class="flag-img-large" /></div>`;
  }

  card.innerHTML = badge + texto + displayHTML;
  area.appendChild(card);

  // Opciones
  if (pregunta.tipo === 'poblacion') {
    renderizarOpcionesPoblacion(pregunta, area);
  } else if (pregunta.tipo === 'banderas_inverso') {
    renderizarOpcionesBanderasInverso(pregunta, area);
  } else {
    renderizarOpcionesEstandar(pregunta, area);
  }
}

function renderizarOpcionesBanderasInverso(pregunta, area) {
  const grid = document.createElement('div');
  grid.className = 'options-grid quad';

  pregunta.opciones.forEach(opcion => {
    const btn = document.createElement('button');
    btn.className  = 'opt-btn';
    btn.style.padding = '8px';
    btn.innerHTML = `<img src="https://flagcdn.com/w160/${opcion}.png" alt="Bandera" class="flag-img-opt" />`;
    btn.dataset.valor = opcion;
    btn.addEventListener('click', () => procesarRespuesta(opcion, btn));
    grid.appendChild(btn);
  });
  area.appendChild(grid);
}

function renderizarOpcionesEstandar(pregunta, area) {
  const grid = document.createElement('div');
  grid.className = 'options-grid quad';

  pregunta.opciones.forEach(opcion => {
    const btn = document.createElement('button');
    btn.className  = 'opt-btn';
    btn.textContent = opcion;
    btn.dataset.valor = opcion;
    btn.addEventListener('click', () => procesarRespuesta(opcion, btn));
    grid.appendChild(btn);
  });
  area.appendChild(grid);
}

function renderizarOpcionesPoblacion(pregunta, area) {
  const grid = document.createElement('div');
  grid.className = 'options-grid duo';

  pregunta.opciones.forEach(pais => {
    const btn = document.createElement('button');
    btn.className = 'pop-btn';
    btn.innerHTML = `
      <span class="pop-flag"><img src="https://flagcdn.com/w40/${pais.code}.png" alt="Bandera" class="flag-img-small" /></span>
      <span>${pais.nombre}</span>
      <span style="font-size:.75rem;color:var(--text-muted);font-weight:400">${pais.region.replace('_', ' ')}</span>
    `;
    btn.dataset.valor = pais.nombre;
    btn.addEventListener('click', () => procesarRespuesta(pais.nombre, btn));
    grid.appendChild(btn);
  });
  area.appendChild(grid);
}

/** Procesa la respuesta del jugador. */
function procesarRespuesta(opcion, btnClicado) {
  if (juegoActual.respondida) return;

  const resultado = juegoActual.responder(opcion);
  const correcto  = resultado.correcto;

  // Feedback visual en botones
  const esPoblacion = juegoActual.pregunta.tipo === 'poblacion';
  const selector    = esPoblacion ? '.pop-btn' : '.opt-btn';

  document.querySelectorAll(selector).forEach(btn => {
    btn.disabled = true;
    const valor  = btn.dataset.valor;
    if (valor === juegoActual.pregunta.correcto) {
      btn.classList.add('correct');
      if (esPoblacion) {
        const paisObj = juegoActual.pregunta.opciones.find(p => p.nombre === valor);
        if (paisObj) {
          const popSpan = document.createElement('div');
          popSpan.style.marginTop = '8px';
          popSpan.style.fontWeight = 'bold';
          popSpan.innerHTML = `👥 ${paisObj.poblacion.toLocaleString('es-ES')}`;
          btn.appendChild(popSpan);
        }
      }
    } else if (btn === btnClicado && !correcto) {
      btn.classList.add('wrong');
    } else {
      btn.classList.add('dim');
    }
  });

  // Toast de feedback + sonido
  if (correcto) {
    playSound('correct');
    mostrarToast('¡Correcto! +' + resultado.puntos, 'correct', 900);
    mostrarPuntosFlotantes(resultado.puntos, btnClicado);
  } else {
    playSound('wrong');
    mostrarToast('Incorrecto 💔', 'wrong', 900);
  }

  // Actualizar HUD
  actualizarHUD(resultado);

  // Siguiente pregunta
  setTimeout(() => {
    siguientePregunta();
  }, correcto ? 1200 : 1600);
}

function onTiempoAgotado() {
  if (juegoActual.respondida) return;

  playSound('timeout');
  const resultado = juegoActual.tiempoAgotado();

  // Resaltar respuesta correcta
  const esPoblacion = juegoActual.pregunta.tipo === 'poblacion';
  const selector    = esPoblacion ? '.pop-btn' : '.opt-btn';
  document.querySelectorAll(selector).forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.valor === juegoActual.pregunta.correcto) {
      btn.classList.add('correct');
    } else {
      btn.classList.add('dim');
    }
  });

  mostrarToast('⏰ ¡Tiempo agotado!', 'wrong', 1000);
  actualizarHUD(resultado);

  setTimeout(() => {
    if (juegoActual.terminado) mostrarResultados();
    else siguientePregunta();
  }, 1600);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HUD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function actualizarHUD(resultado) {
  // Puntaje
  const scoreEl = $('hud-score');
  scoreEl.textContent = (juegoActual?.puntaje ?? 0).toLocaleString('es-ES');
  scoreEl.style.transform = 'scale(1.15)';
  setTimeout(() => scoreEl.style.transform = '', 200);

  // Vidas
  const livesEl = $('hud-lives');
  if (juegoActual?.formato === 'contrareloj') {
    livesEl.innerHTML = '';
  } else {
    const vidas = juegoActual?.vidas ?? CONFIG.VIDAS_INICIALES;
    const total = CONFIG.VIDAS_INICIALES;
    livesEl.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const h = document.createElement('span');
      h.className = 'life-heart' + (i >= vidas ? ' lost' : '');
      h.textContent = '❤️';
      if (resultado && !resultado.correcto && i === vidas) h.classList.add('pulse');
      livesEl.appendChild(h);
    }
  }

  // Racha
  const racha = juegoActual?.racha ?? 0;
  const streakEl = $('hud-streak');
  const streakNum = $('streak-num');
  if (racha >= 2) {
    streakEl.classList.add('visible');
    streakNum.textContent = racha;
  } else {
    streakEl.classList.remove('visible');
  }

  // Modo y región en header
  if (juegoActual) {
    const formatoLabel = juegoActual.formato === 'clasico' ? 'Clásico' : juegoActual.formato === 'supervivencia' ? 'Supervivencia' : 'Contra Reloj';
    $('game-modo-label').textContent =
      `${MODOS[juegoActual.modo]?.emoji || ''} ${MODOS[juegoActual.modo]?.label || ''} (${formatoLabel}) · ${REGIONES[juegoActual.region]?.label || ''}`;
  }
}

function actualizarTimer(segundos) {
  const fill   = $('timer-fill');
  const numEl  = $('timer-num');
  const isCR   = juegoActual?.formato === 'contrareloj';
  const total  = isCR ? 60 : CONFIG.TIEMPO_POR_PREGUNTA;
  const pct    = Math.min((segundos / total) * 100, 100);

  fill.style.width = pct + '%';
  numEl.textContent = segundos;

  // Cambiar color según tiempo
  fill.classList.remove('medium', 'low');
  numEl.classList.remove('low');
  if (pct <= 30) {
    fill.classList.add('low');
    numEl.classList.add('low');
    if (segundos > 0 && segundos <= 5 && juegoActual && !juegoActual.respondida) {
      playWarningSound();
    }
  } else if (pct <= 55) {
    fill.classList.add('medium');
  }
}

function actualizarProgreso() {
  const pregNum = juegoActual.preguntaActual;
  const total   = juegoActual.totalPreguntas;
  const progressFill = $('progress-fill');
  const progressLabel = $('progress-label');

  if (juegoActual.formato === 'clasico') {
    const pct     = (pregNum / total) * 100;
    progressFill.style.width  = pct + '%';
    progressFill.style.background = '';
    progressLabel.textContent = `${pregNum} / ${total}`;
  } else if (juegoActual.formato === 'supervivencia') {
    progressFill.style.width  = '100%';
    progressFill.style.background = 'var(--success)';
    progressLabel.textContent = `Pregunta ${pregNum + 1} · Aciertos: ${juegoActual.aciertos}`;
  } else if (juegoActual.formato === 'contrareloj') {
    progressFill.style.width  = '100%';
    progressFill.style.background = 'var(--warning)';
    progressLabel.textContent = `Aciertos: ${juegoActual.aciertos}`;
  }

  // Reiniciar timer visual
  if (juegoActual.formato !== 'contrareloj') {
    actualizarTimer(CONFIG.TIEMPO_POR_PREGUNTA);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RESULTADOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function mostrarResultados() {
  const r = juegoActual.obtenerResumen();
  puntajeGuardado = false;

  const statsPrevia = obtenerEstadisticas();
  const mejorPuntajePrevio = statsPrevia.mejorPuntaje;

  // Guardar estadísticas automáticamente
  actualizarEstadisticas(r);

  // Emoji de resultado
  let emoji, titulo, sub;
  const pct = r.porcentaje;
  if (pct === 100) { emoji='🏆'; titulo='¡Perfecto!';      sub='¡Lo has clavado todo! Eres un experto.'; }
  else if (pct >= 80) { emoji='🌟'; titulo='¡Excelente!';  sub='¡Gran conocimiento geográfico!'; }
  else if (pct >= 60) { emoji='👏'; titulo='¡Bien hecho!'; sub='¡Eso estuvo bastante bien!'; }
  else if (pct >= 40) { emoji='🙂'; titulo='Puedes mejorar'; sub='¡Sigue practicando y lo lograrás!'; }
  else               { emoji='😅'; titulo='¡A estudiar!';  sub='¡La próxima vez mejor!'; }

  // Si se quedó sin vidas
  if (r.formato !== 'contrareloj' && r.vidas <= 0 && r.aciertos < r.total) {
    emoji = '💔'; titulo = 'Sin vidas'; sub = '¡Sin vidas, pero fue emocionante!';
  }

  $('res-emoji').textContent  = emoji;
  $('res-title').textContent  = titulo;
  $('res-sub').textContent    = sub;
  $('res-score-val').textContent = r.puntaje.toLocaleString('es-ES');
  
  const formatoLabel = r.formato === 'clasico' ? 'Clásico' : r.formato === 'supervivencia' ? 'Supervivencia' : 'Contra Reloj';
  $('res-modo').textContent   = `${MODOS[r.modo]?.label} (${formatoLabel}) · ${REGIONES[r.region]?.label}`;

  $('res-stat-aciertos').textContent  = `${r.aciertos}/${r.total}`;
  $('res-stat-pct').textContent       = `${r.porcentaje}%`;
  $('res-stat-racha').textContent     = r.racha;
  $('res-stat-puntaje').textContent   = Math.max(r.puntaje, mejorPuntajePrevio).toLocaleString('es-ES');

  // Sonido y Confeti de fin de juego
  const esMejorPuntaje = r.puntaje > mejorPuntajePrevio && r.puntaje > 0;
  if (pct === 100 || esMejorPuntaje) {
    playVictorySound();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  } else {
    if (r.formato !== 'contrareloj' && r.vidas <= 0) {
      playDefeatSound();
    } else {
      playVictorySound();
    }
  }

  // Renderizar historial detallado
  const historyList = $('history-list');
  historyList.innerHTML = '';
  
  // Cerrar el acordeón al principio
  const content = $('history-content');
  const wrapper = $('history-accordion');
  content.style.maxHeight = '0px';
  wrapper.classList.remove('open');

  r.historial.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `history-item ${item.correcto ? 'correct' : 'wrong'}`;
    
    const statusText = item.correcto ? '✓ Correcto' : '✗ Incorrecto';
    
    let answersHTML = '';
    if (item.correcto) {
      answersHTML = `Respuesta: <span class="hl">${item.respuestaCorrecta}</span>`;
    } else {
      if (item.opcionSeleccionada === '__tiempo_agotado__') {
        answersHTML = `<span class="hl-wrong">Tiempo agotado</span> Respuesta correcta: <span class="hl">${item.respuestaCorrecta}</span>`;
      } else {
        answersHTML = `<span class="hl-wrong">${item.opcionSeleccionada}</span> Respuesta correcta: <span class="hl">${item.respuestaCorrecta}</span>`;
      }
    }
    
    li.innerHTML = `
      <div class="history-item-header">
        <span class="history-item-q">#${index + 1}. ${item.preguntaTexto}</span>
        <span class="history-item-status">${statusText}</span>
      </div>
      <div class="history-item-a">${answersHTML}</div>
    `;
    historyList.appendChild(li);
  });

  // Resetear formulario
  $('input-nombre').value = nombreJugador || '';
  $('btn-guardar').disabled = false;
  $('msg-guardado').style.display = 'none';

  mostrarScreen('results');

  // Animación del score
  animarNumero($('res-score-val'), 0, r.puntaje, 800);
}

/** Muestra resultados con un resumen ya construido (para modos externos como idiomas). */
function mostrarResultadosConResumen(r) {
  puntajeGuardado = false;
  const statsPrevia = obtenerEstadisticas();
  const mejorPuntajePrevio = statsPrevia.mejorPuntaje;
  const pct = r.porcentaje;
  let emoji, titulo, sub;
  if (pct === 100)      { emoji='🏆'; titulo='¡Perfecto!';       sub='¡Reconociste todos los idiomas!'; }
  else if (pct >= 80)   { emoji='🌟'; titulo='¡Excelente!';      sub='¡Oído y vista de lingüista!'; }
  else if (pct >= 60)   { emoji='👏'; titulo='¡Bien hecho!';     sub='¡Buen trabajo con los idiomas!'; }
  else if (pct >= 40)   { emoji='🙂'; titulo='Puedes mejorar';   sub='¡Sigue escuchando idiomas!'; }
  else                  { emoji='😅'; titulo='¡A practicar!';    sub='¡Los idiomas son difíciles, no te rindas!'; }
  $('res-emoji').textContent     = emoji;
  $('res-title').textContent     = titulo;
  $('res-sub').textContent       = sub;
  $('res-score-val').textContent = r.puntaje.toLocaleString('es-ES');
  $('res-modo').textContent      = r.modo === 'idiomas_audio' ? '🔊 Idiomas · Audio' : '✍️ Idiomas · Escritura';
  $('res-stat-aciertos').textContent = `${r.aciertos}/${r.total}`;
  $('res-stat-pct').textContent      = `${r.porcentaje}%`;
  $('res-stat-racha').textContent    = r.racha;
  $('res-stat-puntaje').textContent  = Math.max(r.puntaje, mejorPuntajePrevio).toLocaleString('es-ES');
  if (pct === 100 || r.puntaje > mejorPuntajePrevio) {
    playVictorySound();
    if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  } else { playVictorySound(); }
  const historyList = $('history-list');
  historyList.innerHTML = '';
  const histContent = $('history-content');
  const histWrapper = $('history-accordion');
  if (histContent) histContent.style.maxHeight = '0px';
  if (histWrapper) histWrapper.classList.remove('open');
  r.historial.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = `history-item ${item.correcto ? 'correct' : 'wrong'}`;
    li.innerHTML = `<div class="history-item-header"><span class="history-item-q">#${i+1}. ${item.idioma}</span><span class="history-item-status">${item.correcto ? '✓ Correcto' : '✗ Incorrecto'}</span></div>`;
    historyList.appendChild(li);
  });
  $('input-nombre').value = nombreJugador || '';
  $('btn-guardar').disabled = false;
  $('msg-guardado').style.display = 'none';
  mostrarScreen('results');
  animarNumero($('res-score-val'), 0, r.puntaje, 800);
}

/** Anima un número del valor inicial al final. */
function animarNumero(el, desde, hasta, duracion) {
  const inicio = performance.now();
  const diff   = hasta - desde;
  const step   = ts => {
    const t = Math.min((ts - inicio) / duracion, 1);
    const ease = t < .5 ? 2*t*t : -1+(4-2*t)*t; // ease in-out quad
    el.textContent = Math.round(desde + diff * ease).toLocaleString('es-ES');
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Guardar puntaje ────────────────────────────────────────
$('btn-guardar').addEventListener('click', async () => {
  const nombre = $('input-nombre').value.trim();
  if (!nombre) {
    $('input-nombre').focus();
    $('input-nombre').style.borderColor = 'var(--danger)';
    setTimeout(() => $('input-nombre').style.borderColor = '', 1500);
    return;
  }
  if (puntajeGuardado) return;

  nombreJugador = nombre;

  // Obtener resumen del juego activo (normal o idiomas)
  let r;
  if (typeof idiomasJuego !== 'undefined' && idiomasJuego && juegoActual === null) {
    r = idiomasJuego.obtenerResumen();
  } else {
    r = juegoActual.obtenerResumen();
  }

  $('btn-guardar').disabled = true;
  $('btn-guardar').textContent = 'Guardando... ⏳';

  const pos = await guardarPuntaje({ nombre, ...r });
  puntajeGuardado = true;

  const msgEl = $('msg-guardado');
  msgEl.style.display = 'block';
  if (pos && pos <= 10) {
    msgEl.innerHTML = `✅ ¡Guardado! Estás en el <strong>#${pos}</strong> del ranking global 🏆`;
  } else {
    msgEl.innerHTML = `✅ ¡Puntaje guardado con éxito!`;
  }
});

// ── Botones de resultados ──────────────────────────────────
$('btn-jugar-de-nuevo').addEventListener('click', () => {
  iniciarJuego(juegoActual.modo, juegoActual.region);
});

$('btn-cambiar-modo').addEventListener('click', () => {
  detenerJuegoActual();
  mostrarScreen('menu');
  inicializarMenu();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MODAL DE RANKING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let rankingModoActual = 'todos';

function abrirRanking() {
  $('ranking-modal').classList.add('open');
  renderizarRanking(rankingModoActual);
}

function cerrarRanking() {
  $('ranking-modal').classList.remove('open');
}

function renderizarRanking(modo) {
  rankingModoActual = modo;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === modo);
  });

  const tbody = $('ranking-tbody');
  tbody.innerHTML = `<tr><td colspan="5" class="ranking-empty">⏳ Cargando clasificación...</td></tr>`;

  obtenerRankingAsync().then(ranking => {
    const datos = ranking.filter(e => e.modo === modo || modo === 'todos');
    tbody.innerHTML = '';
    if (!datos.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="ranking-empty">🌍 ¡Aún no hay registros!<br>Sé el primero en guardar tu puntaje.</td></tr>`;
      return;
    }
    datos.slice(0, 10).forEach((entry, i) => {
      const posLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
      const modoInfo = MODOS[entry.modo] || { emoji: '🗣️', label: entry.modo };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="rank-pos ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${posLabel}</td>
        <td class="rank-nombre">${entry.nombre}</td>
        <td class="rank-puntaje">${entry.puntaje.toLocaleString('es-ES')}</td>
        <td class="rank-modo">${modoInfo.emoji} ${modoInfo.label}</td>
        <td style="font-size:.75rem;color:var(--text-muted)">${entry.fecha}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// Listeners ranking
if ($('btn-ranking-menu')) $('btn-ranking-menu').addEventListener('click', abrirRanking);
$('btn-ranking-results').addEventListener('click', abrirRanking);
$('btn-close-ranking').addEventListener('click', cerrarRanking);
$('ranking-modal').addEventListener('click', e => { if (e.target === $('ranking-modal')) cerrarRanking(); });

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => renderizarRanking(btn.dataset.tab));
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UTILIDADES DE UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Muestra un toast de feedback. */
function mostrarToast(mensaje, tipo, duracion = 1200) {
  const toast = $('feedback-toast');
  toast.textContent = mensaje;
  toast.className   = `feedback-toast ${tipo} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duracion);
}

/** Muestra los puntos flotando sobre el botón. */
function mostrarPuntosFlotantes(puntos, btn) {
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const el   = document.createElement('div');
  el.className   = 'float-points';
  el.textContent = `+${puntos}`;
  el.style.left  = (rect.left + rect.width / 2) + 'px';
  el.style.top   = (rect.top - 10 + window.scrollY) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

// ── Botón de salir del juego ───────────────────────────────
$('btn-salir-juego').addEventListener('click', () => {
  detenerJuegoActual();
  mostrarScreen('menu');
  inicializarMenu();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ATLAS DE GEOGRAFÍA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function abrirAtlas() {
  mostrarScreen('atlas');
  renderizarAtlas();
}

function cerrarAtlas() {
  mostrarScreen('menu');
  inicializarMenu();
}

function renderizarAtlas() {
  const query = $('atlas-search').value.toLowerCase().trim();
  const region = $('atlas-filter-region').value;
  const grid = $('atlas-grid');
  grid.innerHTML = '';
  
  let filtrados = PAISES;
  if (region !== 'mundo') {
    filtrados = filtrados.filter(p => p.region === region);
  }
  if (query) {
    filtrados = filtrados.filter(p => 
      p.nombre.toLowerCase().includes(query) || 
      p.capital.toLowerCase().includes(query)
    );
  }
  
  if (filtrados.length === 0) {
    grid.innerHTML = '<div class="atlas-empty-msg">🔍 No se encontraron países que coincidan con la búsqueda.</div>';
    return;
  }
  
  const ordenados = [...filtrados].sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  ordenados.forEach(p => {
    const card = document.createElement('div');
    card.className = 'atlas-card glass';
    card.innerHTML = `
      <div class="atlas-card-flag" aria-hidden="true"><img src="https://flagcdn.com/w80/${p.code}.png" alt="${p.nombre}" class="flag-img-atlas" /></div>
      <div class="atlas-card-details">
        <div class="atlas-card-name">${p.nombre}</div>
        <div class="atlas-card-info">🏙️ Capital: <span>${p.capital}</span></div>
        <div class="atlas-card-info">👥 Población: <span>${p.poblacion.toLocaleString('es-ES')}</span></div>
        <div class="atlas-card-info">📍 Región: <span>${REGIONES[p.region]?.label || p.region}</span></div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INICIALIZACIÓN Y BINDINGS DE EVENTOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', () => {
  // Seleccionar modo, región y formato por defecto
  document.querySelector('[data-modo="banderas"]')?.classList.add('selected');
  document.querySelector('[data-region="mundo"]')?.classList.add('selected');
  document.querySelector('[data-formato="clasico"]')?.classList.add('selected');

  // Inicializar UI de sonido
  actualizarMuteUI();

  // Bindings de sonido
  $('btn-mute').addEventListener('click', toggleMute);
  $('btn-mute-game').addEventListener('click', toggleMute);

  // Binding de acordeón de historial
  $('btn-toggle-history').addEventListener('click', () => {
    const content = $('history-content');
    const wrapper = $('history-accordion');
    const isClosed = content.style.maxHeight === '0px' || content.style.maxHeight === '';
    if (isClosed) {
      content.style.maxHeight = '500px';
      wrapper.classList.add('open');
    } else {
      content.style.maxHeight = '0px';
      wrapper.classList.remove('open');
    }
  });

  // Bindings del Atlas
  if ($('btn-atlas-menu')) $('btn-atlas-menu').addEventListener('click', abrirAtlas);
  $('btn-salir-atlas').addEventListener('click', cerrarAtlas);
  $('atlas-search').addEventListener('input', renderizarAtlas);
  $('atlas-filter-region').addEventListener('change', renderizarAtlas);

  // Theme Management
  // El tema se inicializa en el segundo DOMContentLoaded al final del archivo

  // Inicializar screens AQUÍ, cuando el DOM ya existe
  screens = {
    menu:    $('screen-menu'),
    game:    $('screen-game'),
    results: $('screen-results'),
    wordle:  $('screen-wordle'),
    atlas:   $('screen-atlas'),
  };

  inicializarMenuListeners();
  if (typeof inicializarWordleListeners === 'function') inicializarWordleListeners();
  if (typeof inicializarIdiomasListeners === 'function') inicializarIdiomasListeners();

  refrescarMenu();
  document.querySelector('[data-region="mundo"]')?.classList.add('selected');
  inicializarPanelesLaterales();
  mostrarScreen('menu');

  if ($('btn-wordle-menu') && typeof abrirWordle === 'function')
    $('btn-wordle-menu').addEventListener('click', abrirWordle);

  const cardIdiomas = $('modo-idiomas');
  if (cardIdiomas && typeof abrirIdiomasModal === 'function') {
    cardIdiomas.addEventListener('click', abrirIdiomasModal);
    cardIdiomas.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') abrirIdiomasModal();
    });
  }
});

// ════════════════════════════════════════════════════════════
//  SISTEMA DE IDIOMAS (i18n)
// ════════════════════════════════════════════════════════════

const I18N = {
  es: {
    nav: 'Navegación',
    atlas: 'Atlas de Geografía',
    ranking: 'Clasificación',
    theme_label: 'Tema',
    theme: 'Apariencia',
    theme_dark: 'Oscuro',
    theme_light: 'Claro',
    theme_planets_light: 'Planetas (claro)',
    theme_planets_dark: 'Planetas (oscuro)',
    theme_flags: 'Banderas animadas',
    lang_label: 'Idioma',
    // Menú principal
    menu_title: 'El juego de geografía mundial',
    menu_subtitle: 'Pon a prueba tu conocimiento geográfico.',
    menu_tags: 'Banderas · Capitales · Población',
    choose_mode: 'Elige un modo de juego',
    filter_region: 'Filtrar por región',
    wordle_btn: '🌍 GeoWordle del Día',
    // Modos
    mode_banderas: 'Banderas',
    mode_banderas_desc: 'Identifica el país por su bandera',
    mode_capitales: 'Capitales',
    mode_capitales_desc: 'Encuentra la capital del país',
    mode_poblacion: 'Población',
    mode_poblacion_desc: '¿Qué país tiene más habitantes?',
    mode_inverso: 'Banderas Inverso',
    mode_inverso_desc: 'Identifica la bandera por el nombre del país',
    mode_idiomas: 'Idiomas',
    mode_idiomas_desc: 'Reconoce idiomas por escritura o por audio',
    // Formatos
    fmt_clasico: '⏱️ Clásico',
    fmt_supervivencia: '❤️ Supervivencia',
    fmt_contrareloj: '⚡ Contra Reloj',
    // Regiones
    region_mundo: '🌍 Todo el mundo',
    region_america_norte: '🌎 América del Norte',
    region_america_sur: '🌎 América del Sur',
    region_europa: '🌍 Europa',
    region_asia: '🌏 Asia',
    region_africa: '🌍 África',
    region_oceania: '🌏 Oceanía',
    // HUD
    hud_lives: 'Vidas',
    // Resultados
    save_score: 'Guardar puntaje',
    your_name: 'Tu nombre',
    save_btn: '💾 Guardar',
    saved_msg: '✅ ¡Puntaje guardado!',
    play_again: '🔄 Jugar de nuevo',
    back_menu: '🏠 Menú',
    // Panel izquierdo
    your_progress: '🗺️ Tu Progreso',
    geowordle_lbl: '🌍 GeoWordle',
    play_today: '🎯 Jugar GeoWordle de hoy',
    played_won: '✅ ¡Adivinaste el país de hoy!',
    played_lost: '❌ Ya jugaste hoy',
    // Panel derecho
    country_day: '☀️ País del Día',
    did_you_know: '💡 ¿Sabías que...?',
    top3: '🏆 Top 3 Clasificación',
    no_players: 'Nadie ha jugado aún. ¡Sé el primero!',
    your_stats: '📊 Tus Estadísticas Rápidas',
    stat_partidas: 'Partidas',
    stat_aciertos: 'Aciertos',
    stat_mejor: 'Mejor',
    stat_racha: 'Racha',
  },
  en: {
    nav: 'Navigation',
    atlas: 'Geography Atlas',
    ranking: 'Leaderboard',
    theme_label: 'Theme',
    theme: 'Appearance',
    theme_dark: 'Dark',
    theme_light: 'Light',
    theme_planets_light: 'Planets (light)',
    theme_planets_dark: 'Planets (dark)',
    theme_flags: 'Animated flags',
    lang_label: 'Language',
    menu_title: 'The world geography game',
    menu_subtitle: 'Test your geographic knowledge.',
    menu_tags: 'Flags · Capitals · Population',
    choose_mode: 'Choose a game mode',
    filter_region: 'Filter by region',
    wordle_btn: '🌍 GeoWordle of the Day',
    mode_banderas: 'Flags',
    mode_banderas_desc: 'Identify the country by its flag',
    mode_capitales: 'Capitals',
    mode_capitales_desc: 'Find the capital of the country',
    mode_poblacion: 'Population',
    mode_poblacion_desc: 'Which country has more inhabitants?',
    mode_inverso: 'Reverse Flags',
    mode_inverso_desc: 'Identify the flag by the country name',
    mode_idiomas: 'Languages',
    mode_idiomas_desc: 'Recognize languages by writing or audio',
    fmt_clasico: '⏱️ Classic',
    fmt_supervivencia: '❤️ Survival',
    fmt_contrareloj: '⚡ Time Attack',
    region_mundo: '🌍 Whole world',
    region_america_norte: '🌎 North America',
    region_america_sur: '🌎 South America',
    region_europa: '🌍 Europe',
    region_asia: '🌏 Asia',
    region_africa: '🌍 Africa',
    region_oceania: '🌏 Oceania',
    hud_lives: 'Lives',
    save_score: 'Save score',
    your_name: 'Your name',
    save_btn: '💾 Save',
    saved_msg: '✅ Score saved!',
    play_again: '🔄 Play again',
    back_menu: '🏠 Menu',
    your_progress: '🗺️ Your Progress',
    geowordle_lbl: '🌍 GeoWordle',
    play_today: '🎯 Play today\'s GeoWordle',
    played_won: '✅ You guessed today\'s country!',
    played_lost: '❌ Already played today',
    country_day: '☀️ Country of the Day',
    did_you_know: '💡 Did you know...?',
    top3: '🏆 Top 3 Leaderboard',
    no_players: 'Nobody has played yet. Be the first!',
    your_stats: '📊 Your Quick Stats',
    stat_partidas: 'Games',
    stat_aciertos: 'Correct',
    stat_mejor: 'Best',
    stat_racha: 'Streak',
  }
};

let currentLang = localStorage.getItem('mq_lang') || 'es';

function t(key) {
  return I18N[currentLang]?.[key] || I18N['es'][key] || key;
}

function aplicarIdioma() {
  document.documentElement.setAttribute('lang', currentLang === 'en' ? 'en' : 'es');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[currentLang]?.[key]) el.textContent = I18N[currentLang][key];
  });
  // Textos dinámicos específicos
  const maps = {
    'btn-wordle-menu':          t('wordle_btn'),
    'menu-subtitle':            t('menu_subtitle'),
    'menu-tags':                t('menu_tags'),
    'lbl-modo':                 t('choose_mode'),
    'lbl-region':               t('filter_region'),
    'region-mundo':             t('region_mundo'),
    'region-america-norte':     t('region_america_norte'),
    'region-america-sur':       t('region_america_sur'),
    'region-europa':            t('region_europa'),
    'region-asia':              t('region_asia'),
    'region-africa':            t('region_africa'),
    'region-oceania':           t('region_oceania'),
  };
  // Paneles laterales
  const panelMaps = {
    'panel-progreso-header': t('your_progress'),
    'panel-wordle-header':   t('geowordle_lbl'),
    'ww-estado-hoy':         null, // se actualiza en actualizarWordleWidget
  };
  Object.entries(panelMaps).forEach(([id, txt]) => {
    if (txt) { const el = $(id); if (el) el.textContent = txt; }
  });
  // Panel derecho headers con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = I18N[currentLang]?.[key];
    if (val) el.textContent = val;
  });
  // Quick stats labels
  const qstats = document.querySelectorAll('.qstat-lbl');
  const qkeys  = ['stat_partidas','stat_aciertos','stat_mejor','stat_racha'];
  qstats.forEach((el, i) => { if (qkeys[i]) el.textContent = t(qkeys[i]); });
  Object.entries(maps).forEach(([id, txt]) => {
    const el = $(id);
    if (el) el.textContent = txt;
  });
  // Modos de juego
  const modeMap = {
    'modo-banderas':        ['mode_banderas',  'mode_banderas_desc'],
    'modo-capitales':       ['mode_capitales', 'mode_capitales_desc'],
    'modo-poblacion':       ['mode_poblacion', 'mode_poblacion_desc'],
    'modo-banderas-inverso':['mode_inverso',   'mode_inverso_desc'],
    'modo-idiomas':         ['mode_idiomas',   'mode_idiomas_desc'],
  };
  Object.entries(modeMap).forEach(([id, [nameKey, descKey]]) => {
    const card = $(id);
    if (!card) return;
    const name = card.querySelector('.modo-nombre');
    const desc = card.querySelector('.modo-desc');
    if (name) name.textContent = t(nameKey);
    if (desc) desc.textContent = t(descKey);
  });
  // Formato pills
  document.querySelectorAll('.formato-pill[data-formato="clasico"]').forEach(p => p.textContent = t('fmt_clasico'));
  document.querySelectorAll('.formato-pill[data-formato="supervivencia"]').forEach(p => p.textContent = t('fmt_supervivencia'));
  document.querySelectorAll('.formato-pill[data-formato="contrareloj"]').forEach(p => p.textContent = t('fmt_contrareloj'));
  // Botones de resultados
  const btnPlayAgain = $('btn-play-again'); if (btnPlayAgain) btnPlayAgain.textContent = t('play_again');
  const btnMenu2 = $('btn-menu-results'); if (btnMenu2) btnMenu2.textContent = t('back_menu');
  // Marca idioma activo en el menú
  document.querySelectorAll('.lang-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

// ════════════════════════════════════════════════════════════
//  SISTEMA DE TEMAS ESPECIALES
// ════════════════════════════════════════════════════════════

let bgAnimFrame = null;
let planetasCanvas = null;

function aplicarTema(theme) {
  // Cambio INSTANTÁNEO: deshabilitar todas las transiciones durante el cambio
  document.documentElement.classList.add('changing-theme');

  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mq_theme', theme);

  // Marca activo en el menú
  document.querySelectorAll('[data-theme-val]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });

  const flagsBg = $('flags-bg');
  if (flagsBg) {
    if (theme === 'flags') {
      // Solo regenerar si no tiene contenido aún
      if (!flagsBg.children.length) iniciarFondoBanderas(flagsBg);
      flagsBg.style.display = 'flex';
    } else {
      flagsBg.style.display = 'none';
    }
  }

  // Re-habilitar transiciones en el siguiente frame (después del repaint)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('changing-theme');
    });
  });
}

function iniciarAnimacionPlanetas(canvas, isDark) {
  const ctx = canvas.getContext('2d');
  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Crear planetas
  const planetas = Array.from({ length: 14 }, (_, i) => ({
    x:    Math.random() * window.innerWidth,
    y:    Math.random() * window.innerHeight,
    r:    18 + Math.random() * 55,
    vx:   (Math.random() - .5) * .25,
    vy:   (Math.random() - .5) * .25,
    hue:  Math.floor(Math.random() * 360),
    rot:  Math.random() * Math.PI * 2,
    vrot: (Math.random() - .5) * .003,
  }));

  const dibujarPlaneta = (p) => {
    const { x, y, r, hue, rot } = p;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    // Esfera base
    const grad = ctx.createRadialGradient(-r*.3, -r*.3, r*.1, 0, 0, r);
    grad.addColorStop(0, `hsl(${hue},70%,${isDark?60:65}%)`);
    grad.addColorStop(1, `hsl(${hue+30},55%,${isDark?25:35}%)`);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    // Franjas tipo tierra
    ctx.save();
    ctx.clip();
    ctx.fillStyle = `hsla(${(hue+120)%360},60%,${isDark?45:55}%,.55)`;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(i*r*.4, 0, r*.9, r*.22, 0, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
    // Brillo
    const shine = ctx.createRadialGradient(-r*.3, -r*.35, 0, -r*.2, -r*.25, r*.55);
    shine.addColorStop(0, 'rgba(255,255,255,.35)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = shine;
    ctx.fill();
    ctx.restore();
  };

  const animar = () => {
    if (!document.documentElement.getAttribute('data-theme').startsWith('planets')) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    planetas.forEach(p => {
      p.x   = (p.x + p.vx + canvas.width)  % canvas.width;
      p.y   = (p.y + p.vy + canvas.height) % canvas.height;
      p.rot += p.vrot;
      ctx.globalAlpha = .18;
      dibujarPlaneta(p);
    });
    ctx.globalAlpha = 1;
    bgAnimFrame = requestAnimationFrame(animar);
  };

  canvas.style.opacity = '1';
  animar();
}

function iniciarFondoBanderas(container) {
  container.innerHTML = '';

  // Lista completa de códigos — orden fijo para que el loop sea predecible
  const allCodes = [
    'us','gb','fr','de','es','it','jp','cn','br','mx','ar','ru',
    'ca','au','in','kr','tr','sa','eg','za','ng','ke','th','id',
    'pk','bd','vn','ph','my','co','ve','pe','cl','ec','bo','py',
    'uy','gt','cu','do','hn','sv','ni','cr','pa','jm','ht','tt',
    'no','se','dk','fi','nl','be','ch','at','pl','cz','ro','hu',
    'gr','pt','ie','sk','bg','hr','rs','si','ba','al','mk','me',
    'ua','by','md','lt','lv','ee','kz','uz','tm','kg','tj','af',
    'ir','iq','jo','lb','il','ae','kw','qa','om','ye','mn','np',
  ];

  // Cuántas banderas caben en pantalla + buffer
  // Ancho fijo por bandera: 54px + 8px gap = 62px
  const flagW    = 62;
  const perRow   = Math.ceil(window.innerWidth / flagW) + 4;
  const numRows  = Math.ceil(window.innerHeight / 52) + 2;

  for (let r = 0; r < numRows; r++) {
    const row = document.createElement('div');
    row.className = 'flags-row';

    // Tomar un slice distinto por fila, rotando el array
    const offset   = (r * 17) % allCodes.length;
    const rowCodes = [];
    for (let i = 0; i < perRow; i++) {
      rowCodes.push(allCodes[(offset + i) % allCodes.length]);
    }

    // Duplicar EXACTAMENTE: la segunda mitad = primera mitad
    // Esto garantiza que translateX(-50%) sea un loop perfecto
    const doubled = [...rowCodes, ...rowCodes];
    doubled.forEach(code => {
      const img = document.createElement('img');
      img.src     = `https://flagcdn.com/w40/${code}.png`;
      img.alt     = '';
      img.width   = 54;
      img.height  = 36;
      img.loading = 'lazy';
      row.appendChild(img);
    });

    container.appendChild(row);
  }
}

// ════════════════════════════════════════════════════════════
//  MENÚ DESPLEGABLE DE OPCIONES
// ════════════════════════════════════════════════════════════

function inicializarOptionsMenu() {
  const btnOpts   = $('btn-options');
  const dropdown  = $('options-dropdown');
  if (!btnOpts || !dropdown) return;

  // Abrir / cerrar
  btnOpts.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.options-menu-wrap')) {
      dropdown.classList.remove('open');
    }
  });

  // Atlas
  $('opt-atlas')?.addEventListener('click', () => {
    dropdown.classList.remove('open');
    abrirAtlas();
  });

  // Ranking
  $('opt-ranking')?.addEventListener('click', () => {
    dropdown.classList.remove('open');
    abrirRanking();
  });

  // Tema — toggle submenu
  const themeToggle  = $('opt-theme-toggle');
  const themeSubmenu = $('theme-submenu');
  themeToggle?.addEventListener('click', () => {
    themeSubmenu.classList.toggle('open');
    themeToggle.classList.toggle('open');
    themeToggle.setAttribute('aria-expanded', themeSubmenu.classList.contains('open'));
  });

  // Selección de tema
  document.querySelectorAll('[data-theme-val]').forEach(btn => {
    btn.addEventListener('click', () => {
      aplicarTema(btn.dataset.themeVal);
    });
  });

  // Selección de idioma
  document.querySelectorAll('.lang-item').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      localStorage.setItem('mq_lang', currentLang);
      aplicarIdioma();
    });
  });
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar tema guardado
  const savedTheme = localStorage.getItem('mq_theme') || 'dark';
  aplicarTema(savedTheme);

  // Restaurar idioma
  currentLang = localStorage.getItem('mq_lang') || 'es';
  aplicarIdioma();

  inicializarOptionsMenu();

  // Añadir data-i18n dinámicamente a elementos del panel derecho
  const headerMaps = [
    ['panel-pais-dia',       'country_day',   '.panel-header'],
    ['panel-curiosidades',   'did_you_know',  '.panel-header'],
  ];
  headerMaps.forEach(([panelId, key, sel]) => {
    const panel = $(panelId);
    if (panel) {
      const h = panel.querySelector(sel);
      if (h) h.setAttribute('data-i18n', key);
    }
  });

  // Re-aplicar idioma para que se traduzca todo desde el inicio
  aplicarIdioma();
});
