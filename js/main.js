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

  // 3. Mini Ranking
  const datos = JSON.parse(localStorage.getItem('mq_ranking') || '[]');
  const list = $('mini-ranking-list');
  list.innerHTML = '';
  
  const top3 = datos.sort((a, b) => b.puntaje - a.puntaje).slice(0, 3);
  if (top3.length === 0) {
    list.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; text-align:center; padding: 10px 0;">Nadie ha jugado aún. ¡Sé el primero!</div>`;
  } else {
    top3.forEach((entry, i) => {
      const posLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      list.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-2); padding:8px 12px; border-radius:var(--r-sm);">
          <div style="display:flex; gap:8px; align-items:center;">
            <span style="font-size:1.1rem;">${posLabel}</span>
            <span style="font-weight:600; font-size:0.95rem;">${entry.nombre}</span>
          </div>
          <span style="font-family:var(--ff-head); font-weight:700; color:var(--accent);">${entry.puntaje} pts</span>
        </div>
      `;
    });
  }
}

/** Renderiza las estadísticas rápidas en el menú. */
function actualizarQuickStats() {
  const stats = obtenerEstadisticas();
  $('qs-partidas').textContent  = stats.totalPartidas;
  $('qs-aciertos').textContent  = stats.totalAciertos;
  $('qs-best').textContent      = stats.mejorPuntaje.toLocaleString('es-ES');
  $('qs-racha').textContent     = stats.rachaMaxima;
}

/** Refresca solo la UI del menú, sin registrar listeners nuevos. */
function refrescarMenu() {
  actualizarQuickStats();
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
  if (juegoActual) {
    juegoActual.detenerTimer();
  }
  // Detener sonido tick por si está en loop
  if (sounds.tick) {
    sounds.tick.pause();
    sounds.tick.currentTime = 0;
  }
  // Resetear la barra visual del timer
  const fill  = $('timer-fill');
  const numEl = $('timer-num');
  if (fill)  { fill.style.width = '100%'; fill.classList.remove('medium', 'low'); }
  if (numEl) { numEl.textContent = CONFIG.TIEMPO_POR_PREGUNTA; numEl.classList.remove('low'); }
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
$('btn-guardar').addEventListener('click', () => {
  const nombre = $('input-nombre').value.trim();
  if (!nombre) {
    $('input-nombre').focus();
    $('input-nombre').style.borderColor = 'var(--danger)';
    setTimeout(() => $('input-nombre').style.borderColor = '', 1500);
    return;
  }
  if (puntajeGuardado) return;

  nombreJugador = nombre;
  const r = juegoActual.obtenerResumen();
  guardarPuntaje({ nombre, ...r });
  puntajeGuardado = true;

  $('btn-guardar').disabled = true;
  $('msg-guardado').style.display = 'block';
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
  renderizarRanking(rankingModoActual);
  $('ranking-modal').classList.add('open');
}

function cerrarRanking() {
  $('ranking-modal').classList.remove('open');
}

function renderizarRanking(modo) {
  rankingModoActual = modo;
  // Actualizar tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === modo);
  });

  const datos = obtenerRankingPorModo(modo);
  const tbody = $('ranking-tbody');
  tbody.innerHTML = '';

  if (!datos.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="ranking-empty">🌍 ¡Aún no hay registros!<br>Sé el primero en guardar tu puntaje.</td></tr>`;
    return;
  }

  datos.forEach((entry, i) => {
    const posLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
    const modoInfo = MODOS[entry.modo] || { emoji: '?', label: entry.modo };
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
}

// Listeners ranking
$('btn-ranking-menu').addEventListener('click', abrirRanking);
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
  $('btn-atlas-menu').addEventListener('click', abrirAtlas);
  $('btn-salir-atlas').addEventListener('click', cerrarAtlas);
  $('atlas-search').addEventListener('input', renderizarAtlas);
  $('atlas-filter-region').addEventListener('change', renderizarAtlas);

  // Theme Management
  const currentTheme = localStorage.getItem('mq_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  $('btn-theme').textContent = currentTheme === 'light' ? '🌙' : '☀️';

  $('btn-theme').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('mq_theme', newTheme);
    $('btn-theme').textContent = newTheme === 'light' ? '🌙' : '☀️';
  });

  // Inicializar screens AQUÍ, cuando el DOM ya existe
  screens = {
    menu:    $('screen-menu'),
    game:    $('screen-game'),
    results: $('screen-results'),
    wordle:  $('screen-wordle'),
    atlas:   $('screen-atlas'),
  };

  // Detener juego anterior al salir (bug timer persistente)
  const _detenerJuegoActual = detenerJuegoActual;
  function detenerJuegoActual() {
    _detenerJuegoActual();
    if (typeof idiomasJuego !== 'undefined' && idiomasJuego) idiomasJuego.detenerTimer();
    if (typeof detenerAudio === 'function') detenerAudio();
  }

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
