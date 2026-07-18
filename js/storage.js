// ============================================================
//  MAP QUIZ — Almacenamiento (local + ranking compartido en la nube)
// ============================================================

const STORAGE_KEYS = {
  RANKING_LOCAL: 'mq_ranking_local',
  RANKING_CLOUD: 'mq_ranking_cloud_cache',
  RANKING_CLOUD_TS: 'mq_ranking_cloud_ts',
  STATS:   'mq_stats',
};

// ── CONFIGURACIÓN DEL RANKING COMPARTIDO ─────────────────────
// Usamos JSONBin.io como backend gratuito para ranking compartido.
// Crea una cuenta gratuita en https://jsonbin.io y reemplaza estos valores:
const CLOUD_CONFIG = {
  BIN_ID:  '6a593334da38895dfe67bacb',   // <-- reemplaza con tu Bin ID de jsonbin.io
  API_KEY: '$2a$10$s3VSeizWonolyP.4JvAIl.0X0vqX6g4TA64ILwl.xP4t1oAl.Cne2',  // <-- reemplaza con tu API key de jsonbin.io
  CACHE_TTL: 30 * 1000,        // Caché local de 30 segundos
};
const CLOUD_ENABLED = CLOUD_CONFIG.BIN_ID !== 'TU_BIN_ID_AQUI';

// ── MIGRACIÓN: limpiar datos del sistema local anterior ───────
// Versión del sistema de ranking. Cambiar este número fuerza
// un reset del caché local en todos los navegadores.
const RANKING_VERSION = '2'; // v2 = sistema compartido en la nube
(function limpiarDatosViejos() {
  const versionKey = 'mq_ranking_version';
  const versionActual = localStorage.getItem(versionKey);

  // Si la versión no coincide (o no existe), limpiar todo el ranking local
  if (versionActual !== RANKING_VERSION) {
    localStorage.removeItem('mq_ranking');             // clave vieja v1
    localStorage.removeItem(STORAGE_KEYS.RANKING_LOCAL);
    localStorage.removeItem(STORAGE_KEYS.RANKING_CLOUD);
    localStorage.removeItem(STORAGE_KEYS.RANKING_CLOUD_TS);
    localStorage.setItem(versionKey, RANKING_VERSION);
    console.info('[MapQuiz] Caché de ranking reiniciado a v' + RANKING_VERSION);
  }
})();

// ── RANKING EN LA NUBE ────────────────────────────────────────
 * Sube el ranking actualizado a JSONBin.io.
 * Devuelve true si tuvo éxito, false si falló.
 */
async function subirRankingNube(ranking) {
  if (!CLOUD_ENABLED) return false;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${CLOUD_CONFIG.BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CLOUD_CONFIG.API_KEY,
        'X-Bin-Versioning': 'false',
      },
      body: JSON.stringify({ ranking }),
    });
    return res.ok;
  } catch (e) {
    console.warn('[MapQuiz] No se pudo subir ranking a la nube:', e);
    return false;
  }
}

/**
 * Descarga el ranking de JSONBin.io.
 * Usa caché local para no hacer demasiadas peticiones.
 */
async function descargarRankingNube() {
  if (!CLOUD_ENABLED) return null;

  // Verificar caché
  const ts  = parseInt(localStorage.getItem(STORAGE_KEYS.RANKING_CLOUD_TS) || '0');
  const now = Date.now();
  if (now - ts < CLOUD_CONFIG.CACHE_TTL) {
    const cached = localStorage.getItem(STORAGE_KEYS.RANKING_CLOUD);
    if (cached) return JSON.parse(cached);
  }

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${CLOUD_CONFIG.BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CLOUD_CONFIG.API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ranking = data.record?.ranking || [];
    // Actualizar caché
    localStorage.setItem(STORAGE_KEYS.RANKING_CLOUD, JSON.stringify(ranking));
    localStorage.setItem(STORAGE_KEYS.RANKING_CLOUD_TS, String(now));
    return ranking;
  } catch (e) {
    console.warn('[MapQuiz] No se pudo descargar ranking de la nube:', e);
    return null;
  }
}

// ── RANKING LOCAL (fallback) ──────────────────────────────────

function obtenerRankingLocal() {
  const raw = localStorage.getItem(STORAGE_KEYS.RANKING_LOCAL);
  return raw ? JSON.parse(raw) : [];
}

function guardarRankingLocal(ranking) {
  localStorage.setItem(STORAGE_KEYS.RANKING_LOCAL, JSON.stringify(ranking));
}

// ── API PÚBLICA DE RANKING ────────────────────────────────────

/**
 * Guarda una entrada en el ranking (local + nube si está configurada).
 * Devuelve la posición obtenida.
 */
async function guardarPuntaje({ nombre, puntaje, modo, region, aciertos, total }) {
  const nuevaEntrada = {
    nombre, puntaje, modo, region, aciertos, total,
    fecha: new Date().toLocaleDateString('es-ES'),
  };

  // Obtener ranking base (nube si disponible, sino local)
  let ranking = obtenerRankingLocal();
  if (CLOUD_ENABLED) {
    const nube = await descargarRankingNube();
    if (nube && nube.length > 0) ranking = nube;
  }

  ranking.push(nuevaEntrada);
  ranking.sort((a, b) => b.puntaje - a.puntaje);
  const top20 = ranking.slice(0, 20);

  // Guardar localmente siempre
  guardarRankingLocal(top20);

  // Intentar subir a la nube
  if (CLOUD_ENABLED) {
    const ok = await subirRankingNube(top20);
    if (ok) {
      // Actualizar caché
      localStorage.setItem(STORAGE_KEYS.RANKING_CLOUD, JSON.stringify(top20));
      localStorage.setItem(STORAGE_KEYS.RANKING_CLOUD_TS, String(Date.now()));
    }
  }

  // Calcular posición
  const pos = top20.findIndex(e =>
    e.nombre === nombre && e.puntaje === puntaje
  ) + 1;
  return pos;
}

/**
 * Obtiene el ranking completo (nube si disponible, sino local).
 * Versión asíncrona para cuando se abre el modal.
 */
async function obtenerRankingAsync() {
  if (CLOUD_ENABLED) {
    const nube = await descargarRankingNube();
    if (nube && nube.length > 0) {
      guardarRankingLocal(nube); // sincronizar local
      return nube;
    }
  }
  return obtenerRankingLocal();
}

/** Obtiene el ranking de forma síncrona (desde caché local). */
function obtenerRanking() {
  if (CLOUD_ENABLED) {
    const cached = localStorage.getItem(STORAGE_KEYS.RANKING_CLOUD);
    if (cached) return JSON.parse(cached);
  }
  return obtenerRankingLocal();
}

/** Obtiene el ranking filtrado por modo. */
function obtenerRankingPorModo(modo) {
  return obtenerRanking().filter(e => e.modo === modo || modo === 'todos');
}

/** Obtiene el ranking filtrado por modo (versión asíncrona). */
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
function actualizarEstadisticas({ modo, aciertos, total, racha, puntaje }) {
  const stats = obtenerEstadisticas();
  stats.totalPartidas++;
  stats.totalAciertos  += aciertos;
  stats.totalPreguntas += total;
  if (racha   > stats.rachaMaxima)  stats.rachaMaxima  = racha;
  if (puntaje > stats.mejorPuntaje) stats.mejorPuntaje = puntaje;

  if (!stats.porModo[modo]) stats.porModo[modo] = { aciertos: 0, preguntas: 0 };
  stats.porModo[modo].aciertos  += aciertos;
  stats.porModo[modo].preguntas += total;

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

/** Limpia todos los datos guardados. */
function limpiarDatos() {
  localStorage.removeItem(STORAGE_KEYS.RANKING_LOCAL);
  localStorage.removeItem(STORAGE_KEYS.RANKING_CLOUD);
  localStorage.removeItem(STORAGE_KEYS.RANKING_CLOUD_TS);
  localStorage.removeItem(STORAGE_KEYS.STATS);
}
