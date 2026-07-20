// ============================================================
//  MAP QUIZ — Almacenamiento (local + ranking compartido en la nube)
// ============================================================

const STORAGE_KEYS = {
  RANKING_LOCAL:    'mq_ranking_local',
  RANKING_CLOUD:    'mq_ranking_cloud_cache',
  RANKING_CLOUD_TS: 'mq_ranking_cloud_ts',
  STATS:            'mq_stats',
};

const CLOUD_CONFIG = {
  BIN_ID:  '6a593334da38895dfe67bacb',
  API_KEY: '$2a$10$s3VSeizWonolyP.4JvAIl.0X0vqX6g4TA64ILwl.xP4t1oAl.Cne2',
  CACHE_TTL: 30 * 1000,
};
const CLOUD_ENABLED = true;

// ── MIGRACIÓN ─────────────────────────────────────────────────
const RANKING_VERSION = '2';
(function limpiarDatosViejos() {
  const versionKey = 'mq_ranking_version';
  if (localStorage.getItem(versionKey) !== RANKING_VERSION) {
    localStorage.removeItem('mq_ranking');
    localStorage.removeItem(STORAGE_KEYS.RANKING_LOCAL);
    localStorage.removeItem(STORAGE_KEYS.RANKING_CLOUD);
    localStorage.removeItem(STORAGE_KEYS.RANKING_CLOUD_TS);
    localStorage.setItem(versionKey, RANKING_VERSION);
  }
})();

// ── NUBE ──────────────────────────────────────────────────────

async function subirRankingNube(ranking) {
  if (!CLOUD_ENABLED) return false;
  try {
    const res = await fetch('https://api.jsonbin.io/v3/b/' + CLOUD_CONFIG.BIN_ID, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CLOUD_CONFIG.API_KEY,
        'X-Bin-Versioning': 'false',
      },
      body: JSON.stringify({ ranking }),
    });
    return res.ok;
  } catch(e) { return false; }
}

async function descargarRankingNube() {
  if (!CLOUD_ENABLED) return null;
  const ts  = parseInt(localStorage.getItem(STORAGE_KEYS.RANKING_CLOUD_TS) || '0');
  if (Date.now() - ts < CLOUD_CONFIG.CACHE_TTL) {
    const cached = localStorage.getItem(STORAGE_KEYS.RANKING_CLOUD);
    if (cached) return JSON.parse(cached);
  }
  try {
    const res = await fetch('https://api.jsonbin.io/v3/b/' + CLOUD_CONFIG.BIN_ID + '/latest', {
      headers: { 'X-Master-Key': CLOUD_CONFIG.API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ranking = data.record?.ranking || [];
    localStorage.setItem(STORAGE_KEYS.RANKING_CLOUD, JSON.stringify(ranking));
    localStorage.setItem(STORAGE_KEYS.RANKING_CLOUD_TS, String(Date.now()));
    return ranking;
  } catch(e) { return null; }
}

// ── LOCAL ─────────────────────────────────────────────────────

function obtenerRankingLocal() {
  const raw = localStorage.getItem(STORAGE_KEYS.RANKING_LOCAL);
  return raw ? JSON.parse(raw) : [];
}

function guardarRankingLocal(ranking) {
  localStorage.setItem(STORAGE_KEYS.RANKING_LOCAL, JSON.stringify(ranking));
}

// ── API PÚBLICA ───────────────────────────────────────────────

async function guardarPuntaje({ nombre, puntaje, modo, region, aciertos, total }) {
  const nuevaEntrada = {
    nombre, puntaje, modo, region, aciertos, total,
    fecha: new Date().toLocaleDateString('es-ES'),
  };
  let ranking = obtenerRankingLocal();
  if (CLOUD_ENABLED) {
    const nube = await descargarRankingNube();
    if (nube && nube.length > 0) ranking = nube;
  }
  ranking.push(nuevaEntrada);
  ranking.sort((a, b) => b.puntaje - a.puntaje);
  const top20 = ranking.slice(0, 20);
  guardarRankingLocal(top20);
  if (CLOUD_ENABLED) {
    const ok = await subirRankingNube(top20);
    if (ok) {
      localStorage.setItem(STORAGE_KEYS.RANKING_CLOUD, JSON.stringify(top20));
      localStorage.setItem(STORAGE_KEYS.RANKING_CLOUD_TS, String(Date.now()));
    }
  }
  return top20.findIndex(e => e.nombre === nombre && e.puntaje === puntaje) + 1;
}

async function obtenerRankingAsync() {
  if (CLOUD_ENABLED) {
    const nube = await descargarRankingNube();
    if (nube && nube.length > 0) { guardarRankingLocal(nube); return nube; }
  }
  return obtenerRankingLocal();
}

function obtenerRanking() {
  if (CLOUD_ENABLED) {
    const cached = localStorage.getItem(STORAGE_KEYS.RANKING_CLOUD);
    if (cached) return JSON.parse(cached);
  }
  return obtenerRankingLocal();
}

function obtenerRankingPorModo(modo) {
  return obtenerRanking().filter(e => e.modo === modo || modo === 'todos');
}

async function obtenerRankingPorModoAsync(modo) {
  const ranking = await obtenerRankingAsync();
  return ranking.filter(e => e.modo === modo || modo === 'todos');
}

// ── ESTADÍSTICAS ─────────────────────────────────────────────

/** Obtiene las estadísticas del jugador. */
function obtenerEstadisticas() {
  const raw = localStorage.getItem(STORAGE_KEYS.STATS);
  const defaults = {
    totalPartidas:  0,
    totalAciertos:  0,
    totalPreguntas: 0,
    rachaMaxima:    0,
    mejorPuntaje:   0,
    porModo: {
      banderas:  { aciertos: 0, preguntas: 0 },
      capitales: { aciertos: 0, preguntas: 0 },
      poblacion: { aciertos: 0, preguntas: 0 },
    },
  };
  return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
}

/** Actualiza las estadísticas tras una partida. */
function actualizarEstadisticas({ modo, region, aciertos, total, racha, puntaje }) {
  const stats = obtenerEstadisticas();
  stats.totalPartidas++;
  stats.totalAciertos  += aciertos;
  stats.totalPreguntas += total;
  if (racha   > stats.rachaMaxima)  stats.rachaMaxima  = racha;
  if (puntaje > stats.mejorPuntaje) stats.mejorPuntaje = puntaje;

  // Progreso por modo
  if (!stats.porModo[modo]) stats.porModo[modo] = { aciertos: 0, preguntas: 0 };
  stats.porModo[modo].aciertos  += aciertos;
  stats.porModo[modo].preguntas += total;

  // Progreso por región
  if (region && region !== 'mundo') {
    if (!stats.porRegion) stats.porRegion = {};
    if (!stats.porRegion[region]) stats.porRegion[region] = { aciertos: 0, total: 0 };
    stats.porRegion[region].aciertos += aciertos;
    stats.porRegion[region].total    += total;
  } else if (region === 'mundo') {
    // Si jugó "todo el mundo" sumar a todas las regiones con peso proporcional
    // Simplificado: solo registrar como global
    if (!stats.porRegion) stats.porRegion = {};
  }

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

/** Limpia todos los datos guardados. */
function limpiarDatos() {
  localStorage.removeItem(STORAGE_KEYS.RANKING);
  localStorage.removeItem(STORAGE_KEYS.STATS);
}
