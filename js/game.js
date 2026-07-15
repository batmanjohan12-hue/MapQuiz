// ============================================================
//  MAP QUIZ — Motor del juego
// ============================================================

const CONFIG = {
  PREGUNTAS_POR_PARTIDA: 10,
  VIDAS_INICIALES:       3,
  TIEMPO_POR_PREGUNTA:   15,   // segundos
  PUNTOS_BASE:           100,
  PUNTOS_TIEMPO_MAX:     50,   // bonus máx. por velocidad
  PUNTOS_RACHA:          25,   // por cada nivel de racha (racha ≥ 2)
  OPCIONES:              4,    // opciones en banderas / capitales
};

// ─────────────────────────────────────────────────────────────
class MapQuizGame {
  constructor(modo, region, formato = 'clasico') {
    this.modo    = modo;
    this.region  = region;
    this.formato = formato; // 'clasico', 'supervivencia', 'contrareloj'
    this.pool    = getPaisesPorRegion(region);   // países disponibles

    // Estado
    this.preguntaActual  = 0;
    this.vidas           = CONFIG.VIDAS_INICIALES;
    this.puntaje         = 0;
    this.racha           = 0;
    this.rachaMaxima     = 0;
    this.aciertos        = 0;
    this.historial       = [];   // { correcto, paisCorrecto, tiempoRestante, puntos }

    this.timerInterval   = null;
    this.tiempoRestante  = formato === 'contrareloj' ? 60 : CONFIG.TIEMPO_POR_PREGUNTA;
    this.respondida      = false;

    this.pregunta        = null;   // pregunta generada actualmente
  }

  // ── Getters útiles ─────────────────────────────────────────

  get totalPreguntas() { 
    if (this.formato === 'clasico') return CONFIG.PREGUNTAS_POR_PARTIDA;
    return Infinity; 
  }
  
  get terminado() { 
    if (this.formato === 'clasico') {
      return this.preguntaActual >= CONFIG.PREGUNTAS_POR_PARTIDA || this.vidas <= 0;
    }
    if (this.formato === 'supervivencia') {
      return this.vidas <= 0;
    }
    if (this.formato === 'contrareloj') {
      return this.tiempoRestante <= 0;
    }
    return false;
  }
  
  get porcentaje() { 
    return Math.round((this.aciertos / Math.max(this.preguntaActual, 1)) * 100); 
  }

  // ── Generación de preguntas ────────────────────────────────

  /** Genera la siguiente pregunta según el modo de juego. */
  generarPregunta() {
    this.respondida = false;
    if (this.modo === 'banderas')         return this._preguntaBanderas();
    if (this.modo === 'capitales')        return this._preguntaCapitales();
    if (this.modo === 'poblacion')        return this._preguntaPoblacion();
    if (this.modo === 'banderas_inverso') return this._preguntaBanderasInverso();
  }

  _preguntaBanderas() {
    const correcto   = muestraAleatoria(this.pool, 1)[0];
    const incorrectos = this._getOpciones(correcto, 3, p => p.nombre);
    const opciones   = mezclar([correcto.nombre, ...incorrectos]);
    this.pregunta = {
      tipo:        'banderas',
      texto:       '¿De qué país es esta bandera?',
      display:     correcto.code,
      correcto:    correcto.nombre,
      opciones,
      pais:        correcto,
    };
    return this.pregunta;
  }

  _preguntaCapitales() {
    const correcto   = muestraAleatoria(this.pool, 1)[0];
    const incorrectos = this._getOpciones(correcto, 3, p => p.capital);
    const opciones   = mezclar([correcto.capital, ...incorrectos]);
    this.pregunta = {
      tipo:     'capitales',
      texto:    `¿Cuál es la capital de ${correcto.nombre}?`,
      display:  correcto.code,
      correcto: correcto.capital,
      opciones,
      pais:     correcto,
    };
    return this.pregunta;
  }

  _preguntaPoblacion() {
    const [pA, pB] = muestraAleatoria(this.pool, 2);
    const mayorPob  = pA.poblacion > pB.poblacion ? pA : pB;
    this.pregunta = {
      tipo:      'poblacion',
      texto:     '¿Cuál país tiene mayor población?',
      display:   null,
      correcto:  mayorPob.nombre,
      opciones:  [pA, pB],   // objetos completos para mostrar banderas
      pais:      mayorPob,
    };
    return this.pregunta;
  }

  _preguntaBanderasInverso() {
    const correcto   = muestraAleatoria(this.pool, 1)[0];
    const incorrectos = this._getOpciones(correcto, 3, p => p.code);
    const opciones   = mezclar([correcto.code, ...incorrectos]);
    this.pregunta = {
      tipo:        'banderas_inverso',
      texto:       `¿Cuál es la bandera de ${correcto.nombre}?`,
      display:     null,
      correcto:    correcto.code,
      opciones,
      pais:        correcto,
    };
    return this.pregunta;
  }

  /**
   * Genera n respuestas incorrectas distintas al país correcto.
   * Intenta mantener la misma región; si no hay suficientes, amplía al pool global.
   */
  _getOpciones(correcto, n, valorFn) {
    const mismRegion = this.pool.filter(p => p.id !== correcto.id);
    const global     = PAISES.filter(p => p.id !== correcto.id);
    const fuente     = mismRegion.length >= n ? mismRegion : global;
    return muestraAleatoria(fuente, n).map(valorFn);
  }

  // ── Respuesta del jugador ──────────────────────────────────

  /**
   * Procesa la respuesta del jugador.
   * @param {string} opcion — la opción seleccionada
   * @returns {{ correcto: boolean, puntos: number, racha: number, vidas: number }}
   */
  responder(opcion) {
    if (this.respondida) return null;
    this.respondida = true;

    if (this.formato !== 'contrareloj') {
      this.detenerTimer();
    }

    const correcto = opcion === this.pregunta.correcto;

    let puntos = 0;
    if (correcto) {
      // Puntos base + bonus de tiempo + bonus de racha
      let bonusTiempo = 0;
      if (this.formato === 'contrareloj') {
        this.tiempoRestante += 2;
        if (this.tiempoRestante > 99) this.tiempoRestante = 99;
      } else {
        bonusTiempo = Math.floor((this.tiempoRestante / CONFIG.TIEMPO_POR_PREGUNTA) * CONFIG.PUNTOS_TIEMPO_MAX);
      }

      this.racha++;
      if (this.racha > this.rachaMaxima) this.rachaMaxima = this.racha;
      const bonusRacha = this.racha >= 2 ? Math.min(this.racha - 1, 5) * CONFIG.PUNTOS_RACHA : 0;
      puntos = CONFIG.PUNTOS_BASE + bonusTiempo + bonusRacha;
      this.puntaje += puntos;
      this.aciertos++;

      // En supervivencia, regalar 1 vida cada 10 aciertos (hasta un máx de 3 vidas)
      if (this.formato === 'supervivencia' && this.aciertos % 10 === 0) {
        if (this.vidas < CONFIG.VIDAS_INICIALES) {
          this.vidas++;
        }
      }
    } else {
      this.racha = 0;
      if (this.formato === 'contrareloj') {
        this.tiempoRestante -= 5;
        if (this.tiempoRestante < 0) this.tiempoRestante = 0;
      } else {
        this.vidas--;
      }
    }

    this.historial.push({
      correcto,
      paisCorrecto: this.pregunta.pais,
      tiempoRestante: this.tiempoRestante,
      puntos,
      preguntaTexto: this.pregunta.texto,
      opcionSeleccionada: opcion,
      respuestaCorrecta: this.pregunta.correcto
    });

    this.preguntaActual++;
    return { correcto, puntos, racha: this.racha, vidas: this.vidas };
  }

  /** Marca la pregunta como incorrecta por tiempo agotado. */
  tiempoAgotado() {
    return this.responder('__tiempo_agotado__');
  }

  // ── Timer ──────────────────────────────────────────────────

  /** Inicia el temporizador; llama onTick(seg) y onExpire() al vencer. */
  iniciarTimer(onTick, onExpire) {
    if (this.formato === 'contrareloj') {
      if (this.timerInterval) return; // ya está corriendo
      this.timerInterval = setInterval(() => {
        this.tiempoRestante--;
        if (this.tiempoRestante < 0) this.tiempoRestante = 0;
        onTick(this.tiempoRestante);
        if (this.tiempoRestante <= 0) {
          this.detenerTimer();
          onExpire();
        }
      }, 1000);
    } else {
      this.tiempoRestante = CONFIG.TIEMPO_POR_PREGUNTA;
      this.timerInterval = setInterval(() => {
        this.tiempoRestante--;
        onTick(this.tiempoRestante);
        if (this.tiempoRestante <= 0) {
          this.detenerTimer();
          onExpire();
        }
      }, 1000);
    }
  }

  detenerTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  // ── Resumen final ──────────────────────────────────────────

  obtenerResumen() {
    return {
      modo:        this.modo,
      region:      this.region,
      formato:     this.formato,
      puntaje:     this.puntaje,
      aciertos:    this.aciertos,
      total:       this.formato === 'clasico' ? CONFIG.PREGUNTAS_POR_PARTIDA : this.preguntaActual,
      vidas:       this.vidas,
      racha:       this.rachaMaxima,
      porcentaje:  this.porcentaje,
      historial:   this.historial,
    };
  }
}
