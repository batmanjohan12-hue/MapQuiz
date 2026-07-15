// ============================================================
//  MAP QUIZ — Almacenamiento local (localStorage)
// ============================================================

const STORAGE_KEYS = {
  RANKING: 'mq_ranking',
  STATS:   'mq_stats',
};

// ── RANKING ──────────────────────────────────────────────────

/** Guarda una entrada en el ranking (máx. 10 por modo). */
function guardarPuntaje({ nombre, puntaje, modo, region, aciertos, total }) {
  const ranking = obtenerRanking();
  ranking.push({
    nombre,
    puntaje,
    modo,
    region,
    aciertos,
    total,
    fecha: new Date().toLocaleDateString('es-ES'),
  });
  // Ordenar de mayor a menor
  ranking.sort((a, b) => b.puntaje - a.puntaje);
  // Guardar solo los 20 mejores
  const top20 = ranking.slice(0, 20);
  localStorage.setItem(STORAGE_KEYS.RANKING, JSON.stringify(top20));
  // Retornar la posición obtenida
  return top20.findIndex(e => e === top20.find(x =>
    x.nombre === nombre && x.puntaje === puntaje && x.fecha === top20[0].fecha
  )) + 1;
}

/** Obtiene el ranking completo desde localStorage. */
function obtenerRanking() {
  const raw = localStorage.getItem(STORAGE_KEYS.RANKING);
  return raw ? JSON.parse(raw) : [];
}

/** Obtiene el ranking filtrado por modo. */
function obtenerRankingPorModo(modo) {
  return obtenerRanking().filter(e => e.modo === modo || modo === 'todos');
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
  localStorage.removeItem(STORAGE_KEYS.RANKING);
  localStorage.removeItem(STORAGE_KEYS.STATS);
}
