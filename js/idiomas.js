// ============================================================
//  MAP QUIZ — Modo Idiomas (escritura + audio)
// ============================================================

// ── DATOS DE IDIOMAS ─────────────────────────────────────────
// Cada idioma tiene:
//   - id, nombre, bandera (emoji), codigo (BCP-47 para TTS)
//   - muestras: array de frases de muestra en el idioma original
//   - frasesAudio: array de frases que se leen en voz alta (mezcla de tipos)

const IDIOMAS = [
  {
    id: 'español',
    nombre: 'Español',
    bandera: '🇪🇸',
    flagCode: 'es',
    codigo: 'es-ES',
    escritura: 'Latino',
    muestras: [
      'Buenos días, ¿cómo estás?',
      'Me llamo Carlos y soy de Madrid.',
      'Uno, dos, tres, cuatro, cinco.',
      'El cielo es azul y el sol brilla.',
      'Por favor, ¿dónde está la estación?',
    ],
    frasesAudio: [
      'Buenos días, ¿cómo estás?',
      'Uno, dos, tres, cuatro, cinco.',
      'Me llamo Carlos.',
      'Muchas gracias por todo.',
      'El tiempo está muy bonito hoy.',
    ],
  },
  {
    id: 'inglés',
    nombre: 'Inglés',
    bandera: '🇬🇧',
    flagCode: 'gb',
    codigo: 'en-GB',
    escritura: 'Latino',
    muestras: [
      'Good morning, how are you?',
      'My name is James and I am from London.',
      'One, two, three, four, five.',
      'The sky is blue and the sun is shining.',
      'Could you tell me where the station is?',
    ],
    frasesAudio: [
      'Good morning, how are you?',
      'One, two, three, four, five.',
      'My name is James.',
      'Thank you very much.',
      'The weather is lovely today.',
    ],
  },
  {
    id: 'francés',
    nombre: 'Francés',
    bandera: '🇫🇷',
    flagCode: 'fr',
    codigo: 'fr-FR',
    escritura: 'Latino',
    muestras: [
      'Bonjour, comment allez-vous?',
      'Je m\'appelle Pierre et je suis de Paris.',
      'Un, deux, trois, quatre, cinq.',
      'Le ciel est bleu et le soleil brille.',
      'Excusez-moi, où est la gare?',
    ],
    frasesAudio: [
      'Bonjour, comment allez-vous?',
      'Un, deux, trois, quatre, cinq.',
      'Je m\'appelle Pierre.',
      'Merci beaucoup.',
      'Il fait beau aujourd\'hui.',
    ],
  },
  {
    id: 'alemán',
    nombre: 'Alemán',
    bandera: '🇩🇪',
    flagCode: 'de',
    codigo: 'de-DE',
    escritura: 'Latino',
    muestras: [
      'Guten Morgen, wie geht es Ihnen?',
      'Ich heiße Hans und komme aus Berlin.',
      'Eins, zwei, drei, vier, fünf.',
      'Der Himmel ist blau und die Sonne scheint.',
      'Entschuldigung, wo ist der Bahnhof?',
    ],
    frasesAudio: [
      'Guten Morgen, wie geht es Ihnen?',
      'Eins, zwei, drei, vier, fünf.',
      'Ich heiße Hans.',
      'Vielen Dank.',
      'Das Wetter ist schön heute.',
    ],
  },
  {
    id: 'portugués',
    nombre: 'Portugués',
    bandera: '🇵🇹',
    flagCode: 'pt',
    codigo: 'pt-PT',
    escritura: 'Latino',
    muestras: [
      'Bom dia, como está?',
      'O meu nome é João e sou de Lisboa.',
      'Um, dois, três, quatro, cinco.',
      'O céu é azul e o sol brilha.',
      'Com licença, onde fica a estação?',
    ],
    frasesAudio: [
      'Bom dia, como está?',
      'Um, dois, três, quatro, cinco.',
      'O meu nome é João.',
      'Muito obrigado.',
      'Está um dia lindo hoje.',
    ],
  },
  {
    id: 'italiano',
    nombre: 'Italiano',
    bandera: '🇮🇹',
    flagCode: 'it',
    codigo: 'it-IT',
    escritura: 'Latino',
    muestras: [
      'Buongiorno, come stai?',
      'Mi chiamo Marco e sono di Roma.',
      'Uno, due, tre, quattro, cinque.',
      'Il cielo è blu e il sole splende.',
      'Scusa, dov\'è la stazione?',
    ],
    frasesAudio: [
      'Buongiorno, come stai?',
      'Uno, due, tre, quattro, cinque.',
      'Mi chiamo Marco.',
      'Grazie mille.',
      'Che bella giornata oggi.',
    ],
  },
  {
    id: 'japonés',
    nombre: 'Japonés',
    bandera: '🇯🇵',
    flagCode: 'jp',
    codigo: 'ja-JP',
    escritura: 'Kanji/Hiragana',
    muestras: [
      'おはようございます。お元気ですか？',
      '私の名前は田中です。東京から来ました。',
      'いち、に、さん、し、ご。',
      '空は青く、太陽が輝いています。',
      'すみません、駅はどこですか？',
    ],
    frasesAudio: [
      'おはようございます。お元気ですか？',
      'いち、に、さん、し、ご。',
      '私の名前は田中です。',
      'ありがとうございます。',
      '今日はいい天気ですね。',
    ],
  },
  {
    id: 'chino',
    nombre: 'Chino (Mandarín)',
    bandera: '🇨🇳',
    flagCode: 'cn',
    codigo: 'zh-CN',
    escritura: 'Hanzi',
    muestras: [
      '早上好，你好吗？',
      '我叫李明，我来自北京。',
      '一、二、三、四、五。',
      '天空是蓝色的，太阳在闪耀。',
      '打扰一下，火车站在哪里？',
    ],
    frasesAudio: [
      '早上好，你好吗？',
      '一、二、三、四、五。',
      '我叫李明。',
      '非常感谢。',
      '今天天气很好。',
    ],
  },
  {
    id: 'árabe',
    nombre: 'Árabe',
    bandera: '🇸🇦',
    flagCode: 'sa',
    codigo: 'ar-SA',
    escritura: 'Árabe',
    muestras: [
      'صباح الخير، كيف حالك؟',
      'اسمي محمد وأنا من الرياض.',
      'واحد، اثنان، ثلاثة، أربعة، خمسة.',
      'السماء زرقاء والشمس تسطع.',
      'عفواً، أين محطة القطار؟',
    ],
    frasesAudio: [
      'صباح الخير، كيف حالك؟',
      'واحد، اثنان، ثلاثة، أربعة، خمسة.',
      'اسمي محمد.',
      'شكراً جزيلاً.',
      'الطقس جميل اليوم.',
    ],
  },
  {
    id: 'ruso',
    nombre: 'Ruso',
    bandera: '🇷🇺',
    flagCode: 'ru',
    codigo: 'ru-RU',
    escritura: 'Cirílico',
    muestras: [
      'Доброе утро, как вы?',
      'Меня зовут Иван, я из Москвы.',
      'Один, два, три, четыре, пять.',
      'Небо голубое и светит солнце.',
      'Извините, где находится вокзал?',
    ],
    frasesAudio: [
      'Доброе утро, как вы?',
      'Один, два, три, четыре, пять.',
      'Меня зовут Иван.',
      'Большое спасибо.',
      'Сегодня хорошая погода.',
    ],
  },
  {
    id: 'coreano',
    nombre: 'Coreano',
    bandera: '🇰🇷',
    flagCode: 'kr',
    codigo: 'ko-KR',
    escritura: 'Hangul',
    muestras: [
      '안녕하세요, 어떻게 지내세요?',
      '제 이름은 김민준이고 서울에서 왔어요.',
      '일, 이, 삼, 사, 오.',
      '하늘은 파랗고 태양이 빛나고 있어요.',
      '실례합니다, 기차역이 어디에 있나요?',
    ],
    frasesAudio: [
      '안녕하세요, 어떻게 지내세요?',
      '일, 이, 삼, 사, 오.',
      '제 이름은 김민준이에요.',
      '감사합니다.',
      '오늘 날씨가 좋네요.',
    ],
  },
  {
    id: 'hindi',
    nombre: 'Hindi',
    bandera: '🇮🇳',
    flagCode: 'in',
    codigo: 'hi-IN',
    escritura: 'Devanagari',
    muestras: [
      'सुप्रभात, आप कैसे हैं?',
      'मेरा नाम राज है और मैं दिल्ली से हूँ।',
      'एक, दो, तीन, चार, पाँच।',
      'आसमान नीला है और सूरज चमक रहा है।',
      'माफ़ करें, रेलवे स्टेशन कहाँ है?',
    ],
    frasesAudio: [
      'सुप्रभात, आप कैसे हैं?',
      'एक, दो, तीन, चार, पाँच।',
      'मेरा नाम राज है।',
      'बहुत धन्यवाद।',
      'आज मौसम बहुत अच्छा है।',
    ],
  },
  {
    id: 'turco',
    nombre: 'Turco',
    bandera: '🇹🇷',
    flagCode: 'tr',
    codigo: 'tr-TR',
    escritura: 'Latino',
    muestras: [
      'Günaydın, nasılsınız?',
      'Benim adım Mehmet ve İstanbul\'dan geliyorum.',
      'Bir, iki, üç, dört, beş.',
      'Gökyüzü mavi ve güneş parlıyor.',
      'Affedersiniz, tren istasyonu nerede?',
    ],
    frasesAudio: [
      'Günaydın, nasılsınız?',
      'Bir, iki, üç, dört, beş.',
      'Benim adım Mehmet.',
      'Çok teşekkür ederim.',
      'Bugün hava çok güzel.',
    ],
  },
  {
    id: 'griego',
    nombre: 'Griego',
    bandera: '🇬🇷',
    flagCode: 'gr',
    codigo: 'el-GR',
    escritura: 'Griego',
    muestras: [
      'Καλημέρα, πώς είστε;',
      'Με λένε Νίκο και είμαι από την Αθήνα.',
      'Ένα, δύο, τρία, τέσσερα, πέντε.',
      'Ο ουρανός είναι μπλε και ο ήλιος λάμπει.',
      'Συγγνώμη, πού είναι ο σιδηροδρομικός σταθμός;',
    ],
    frasesAudio: [
      'Καλημέρα, πώς είστε;',
      'Ένα, δύο, τρία, τέσσερα, πέντε.',
      'Με λένε Νίκο.',
      'Ευχαριστώ πολύ.',
      'Σήμερα ο καιρός είναι ωραίος.',
    ],
  },
  {
    id: 'polaco',
    nombre: 'Polaco',
    bandera: '🇵🇱',
    flagCode: 'pl',
    codigo: 'pl-PL',
    escritura: 'Latino',
    muestras: [
      'Dzień dobry, jak się masz?',
      'Nazywam się Piotr i jestem z Warszawy.',
      'Jeden, dwa, trzy, cztery, pięć.',
      'Niebo jest niebieskie i świeci słońce.',
      'Przepraszam, gdzie jest dworzec kolejowy?',
    ],
    frasesAudio: [
      'Dzień dobry, jak się masz?',
      'Jeden, dwa, trzy, cztery, pięć.',
      'Nazywam się Piotr.',
      'Dziękuję bardzo.',
      'Dzisiaj jest piękna pogoda.',
    ],
  },
  {
    id: 'holandés',
    nombre: 'Holandés',
    bandera: '🇳🇱',
    flagCode: 'nl',
    codigo: 'nl-NL',
    escritura: 'Latino',
    muestras: [
      'Goedemorgen, hoe gaat het?',
      'Mijn naam is Jan en ik kom uit Amsterdam.',
      'Één, twee, drie, vier, vijf.',
      'De lucht is blauw en de zon schijnt.',
      'Pardon, waar is het treinstation?',
    ],
    frasesAudio: [
      'Goedemorgen, hoe gaat het?',
      'Één, twee, drie, vier, vijf.',
      'Mijn naam is Jan.',
      'Heel erg bedankt.',
      'Het is mooi weer vandaag.',
    ],
  },
];

// ── MOTOR DEL JUEGO DE IDIOMAS ────────────────────────────────

let idiomasJuego = null;

class IdiomasGame {
  constructor(subModo) {
    // subModo: 'escritura' | 'audio'
    this.subModo     = subModo;
    this.puntaje     = 0;
    this.aciertos    = 0;
    this.racha       = 0;
    this.rachaMaxima = 0;
    this.preguntaActual = 0;
    this.totalPreguntas = 10;
    this.respondida  = false;
    this.pregunta    = null;
    this.historial   = [];
    this.usados      = new Set(); // IDs de idiomas ya usados
    this.timerInterval = null;
    this.tiempoRestante = 15;
  }

  generarPregunta() {
    this.respondida = false;
    this.tiempoRestante = 15;

    // Elegir idioma correcto (sin repetir hasta agotar)
    let disponibles = IDIOMAS.filter(i => !this.usados.has(i.id));
    if (disponibles.length === 0) {
      this.usados.clear();
      disponibles = [...IDIOMAS];
    }
    const correcto = disponibles[Math.floor(Math.random() * disponibles.length)];
    this.usados.add(correcto.id);

    // Elegir 3 incorrectos
    const incorrectos = IDIOMAS
      .filter(i => i.id !== correcto.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const opciones = [correcto, ...incorrectos].sort(() => Math.random() - 0.5);

    // Elegir muestra aleatoria
    const idx = Math.floor(Math.random() * correcto.muestras.length);

    this.pregunta = {
      correcto,
      opciones,
      muestra:     correcto.muestras[idx],
      fraseAudio:  correcto.frasesAudio[idx],
      subModo:     this.subModo,
    };
    return this.pregunta;
  }

  responder(idiomaId) {
    if (this.respondida) return null;
    this.respondida = true;
    this.detenerTimer();

    const correcto = idiomaId === this.pregunta.correcto.id;
    let puntos = 0;

    if (correcto) {
      const bonusTiempo = Math.floor((this.tiempoRestante / 15) * 50);
      const bonusRacha  = this.racha >= 2 ? Math.min(this.racha - 1, 5) * 25 : 0;
      puntos = 100 + bonusTiempo + bonusRacha;
      this.puntaje += puntos;
      this.aciertos++;
      this.racha++;
      if (this.racha > this.rachaMaxima) this.rachaMaxima = this.racha;
    } else {
      this.racha = 0;
    }

    this.historial.push({ correcto, puntos, idioma: this.pregunta.correcto.nombre });
    this.preguntaActual++;
    return { correcto, puntos, racha: this.racha };
  }

  tiempoAgotado() {
    return this.responder('__timeout__');
  }

  get terminado() {
    return this.preguntaActual >= this.totalPreguntas;
  }

  get porcentaje() {
    return Math.round((this.aciertos / Math.max(this.preguntaActual, 1)) * 100);
  }

  iniciarTimer(onTick, onExpire) {
    this.timerInterval = setInterval(() => {
      this.tiempoRestante--;
      onTick(this.tiempoRestante);
      if (this.tiempoRestante <= 0) {
        this.detenerTimer();
        onExpire();
      }
    }, 1000);
  }

  detenerTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  obtenerResumen() {
    return {
      modo:      'idiomas_' + this.subModo,
      region:    'mundo',
      formato:   'clasico',
      puntaje:   this.puntaje,
      aciertos:  this.aciertos,
      total:     this.totalPreguntas,
      racha:     this.rachaMaxima,
      porcentaje: this.porcentaje,
      historial: this.historial,
    };
  }
}

// ── WEB SPEECH API ────────────────────────────────────────────

let synth = window.speechSynthesis;
let vozCargada = false;
let ultimaUtterance = null;

function cargarVoces() {
  return new Promise(resolve => {
    const voces = synth.getVoices();
    if (voces.length > 0) { vozCargada = true; resolve(voces); return; }
    synth.addEventListener('voiceschanged', () => {
      vozCargada = true;
      resolve(synth.getVoices());
    }, { once: true });
  });
}

function hablar(texto, codigoIdioma, onEnd) {
  if (!synth) { onEnd?.(); return; }

  // Cancelar y esperar un tick para que el navegador limpie el estado
  synth.cancel();

  setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang  = codigoIdioma;
    utter.rate  = 0.9;
    utter.pitch = 1;

    const voces    = synth.getVoices();
    const langBase = codigoIdioma.split('-')[0];
    const voz      = voces.find(v => v.lang === codigoIdioma)
                  || voces.find(v => v.lang.startsWith(langBase))
                  || null;
    if (voz) utter.voice = voz;

    utter.onend   = () => onEnd?.();
    utter.onerror = () => { console.warn('[TTS] Error:', codigoIdioma); onEnd?.(); };
    ultimaUtterance = utter;
    synth.speak(utter);
  }, 100); // 100ms de pausa para que cancel() se procese
}

function detenerAudio() {
  synth?.cancel();
}

// ── RENDER DE PREGUNTA DE IDIOMAS ────────────────────────────

function renderizarPreguntaIdioma(pregunta) {
  const area = $('game-area-content');
  area.innerHTML = '';
  area.style.animation = 'none';
  void area.offsetWidth;
  area.style.animation = '';

  const card = document.createElement('div');
  card.className = 'question-card';

  const badgeText = `Pregunta ${idiomasJuego.preguntaActual + 1} de ${idiomasJuego.totalPreguntas}`;

  if (pregunta.subModo === 'escritura') {
    // Mostrar texto escrito en el idioma
    card.innerHTML = `
      <p class="q-badge">${badgeText}</p>
      <p class="q-text">¿En qué idioma está escrito este texto?</p>
      <div class="idioma-muestra-wrap">
        <p class="idioma-muestra-texto">${pregunta.muestra}</p>
      </div>
    `;
  } else {
    // Modo audio: botón de reproducir
    card.innerHTML = `
      <p class="q-badge">${badgeText}</p>
      <p class="q-text">¿En qué idioma está hablando esta persona?</p>
      <div class="idioma-audio-wrap">
        <button id="btn-play-audio" class="btn-play-audio" aria-label="Escuchar audio">
          <span class="play-icon">🔊</span>
          <span class="play-label">Escuchar</span>
        </button>
        <p class="audio-hint">Pulsa para escuchar el fragmento de voz</p>
      </div>
    `;
  }

  area.appendChild(card);

  // Opciones (4 idiomas)
  const grid = document.createElement('div');
  grid.className = 'options-grid quad idioma-opts';

  pregunta.opciones.forEach(idioma => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn idioma-opt-btn';
    btn.dataset.valor = idioma.id;
    btn.innerHTML = `
      <img class="idioma-bandera-img" src="https://flagcdn.com/w40/${idioma.flagCode}.png" alt="${idioma.nombre}">
      <span class="idioma-nombre-opt">${idioma.nombre}</span>
      <span class="idioma-escritura-tag">${idioma.escritura}</span>
    `;
    btn.addEventListener('click', () => procesarRespuestaIdioma(idioma.id, btn));
    grid.appendChild(btn);
  });
  area.appendChild(grid);

  // Si es modo audio, reproducir automáticamente
  if (pregunta.subModo === 'audio') {
    const btnPlay = document.getElementById('btn-play-audio');
    let reproduciendo = false;

    const reproducir = () => {
      if (reproduciendo) return;
      reproduciendo = true;
      btnPlay.classList.add('playing');
      btnPlay.querySelector('.play-label').textContent = 'Reproduciendo...';

      const resetBtn = () => {
        reproduciendo = false;
        if (btnPlay && btnPlay.isConnected) {
          btnPlay.classList.remove('playing');
          btnPlay.querySelector('.play-label').textContent = 'Escuchar de nuevo';
        }
      };

      hablar(pregunta.fraseAudio, pregunta.correcto.codigo, resetBtn);

      // Seguro: si onend no dispara (bug de algunos navegadores), liberar tras 8s
      setTimeout(() => { if (reproduciendo) resetBtn(); }, 8000);
    };

    btnPlay.addEventListener('click', reproducir);
    // Reproducir automáticamente tras 500ms
    setTimeout(reproducir, 500);
  }
}

// ── PROCESAR RESPUESTA DE IDIOMAS ─────────────────────────────

function procesarRespuestaIdioma(idiomaId, btnClicado) {
  if (idiomasJuego.respondida) return;
  detenerAudio();

  const resultado = idiomasJuego.responder(idiomaId);
  const correcto  = resultado.correcto;

  // Feedback visual
  document.querySelectorAll('.opt-btn.idioma-opt-btn').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.valor === idiomasJuego.pregunta.correcto.id) {
      btn.classList.add('correct');
    } else if (btn === btnClicado && !correcto) {
      btn.classList.add('wrong');
    } else {
      btn.classList.add('dim');
    }
  });

  if (correcto) {
    playSound('correct');
    mostrarToast('¡Correcto! +' + resultado.puntos, 'correct', 900);
    mostrarPuntosFlotantes(resultado.puntos, btnClicado);
  } else {
    playSound('wrong');
    const nombreCorrecto = idiomasJuego.pregunta.correcto.nombre;
    mostrarToast(`Era ${nombreCorrecto} 💔`, 'wrong', 1200);
  }

  actualizarHUDIdiomas(resultado);

  setTimeout(() => {
    if (idiomasJuego.terminado) {
      mostrarResultadosIdiomas();
    } else {
      const pregunta = idiomasJuego.generarPregunta();
      renderizarPreguntaIdioma(pregunta);
      idiomasJuego.iniciarTimer(
        seg => actualizarTimer(seg),
        ()  => onTiempoAgotadoIdioma(),
      );
    }
  }, correcto ? 1200 : 1800);
}

function onTiempoAgotadoIdioma() {
  if (idiomasJuego.respondida) return;
  detenerAudio();
  playSound('timeout');
  idiomasJuego.tiempoAgotado();

  document.querySelectorAll('.opt-btn.idioma-opt-btn').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.valor === idiomasJuego.pregunta.correcto.id) {
      btn.classList.add('correct');
    }
  });

  mostrarToast('¡Tiempo! ⏱️', 'wrong', 900);
  actualizarHUDIdiomas({ correcto: false, puntos: 0, racha: 0 });

  setTimeout(() => {
    if (idiomasJuego.terminado) {
      mostrarResultadosIdiomas();
    } else {
      const pregunta = idiomasJuego.generarPregunta();
      renderizarPreguntaIdioma(pregunta);
      idiomasJuego.iniciarTimer(
        seg => actualizarTimer(seg),
        ()  => onTiempoAgotadoIdioma(),
      );
    }
  }, 1800);
}

// ── HUD PARA IDIOMAS ─────────────────────────────────────────

function actualizarHUDIdiomas(resultado) {
  // Puntaje
  const puntajeEl = $('hud-puntaje');
  if (puntajeEl) puntajeEl.textContent = idiomasJuego.puntaje.toLocaleString('es-ES');

  // Vidas / aciertos (mostrar como aciertos/total)
  const vidasEl = $('hud-vidas');
  if (vidasEl) vidasEl.textContent = `${idiomasJuego.aciertos}/${idiomasJuego.totalPreguntas}`;

  // Barra de PROGRESO de preguntas (cuántas van de 10)
  const progressFill  = $('progress-fill');
  const progressLabel = $('progress-label');
  const pregNum = idiomasJuego.preguntaActual; // ya incrementado tras responder
  const total   = idiomasJuego.totalPreguntas;
  if (progressFill) {
    progressFill.style.width      = `${(pregNum / total) * 100}%`;
    progressFill.style.background = '';
  }
  if (progressLabel) progressLabel.textContent = `${pregNum} / ${total}`;

  // Resetear barra de tiempo para la siguiente pregunta
  actualizarTimer(15);
}

// ── RESULTADOS DE IDIOMAS ─────────────────────────────────────

function mostrarResultadosIdiomas() {
  idiomasJuego.detenerTimer();
  detenerAudio();
  const resumen = idiomasJuego.obtenerResumen();
  actualizarEstadisticas(resumen);

  // Reutilizar pantalla de resultados del juego principal
  mostrarResultadosConResumen(resumen);
}

// ── INICIAR JUEGO DE IDIOMAS ─────────────────────────────────

function iniciarJuegoIdiomas(subModo) {
  // Detener juego anterior si hay uno
  if (idiomasJuego) idiomasJuego.detenerTimer();
  detenerAudio();

  cargarVoces(); // precarga en background

  idiomasJuego = new IdiomasGame(subModo);
  puntajeGuardado = false;

  mostrarScreen('game');

  // Configurar HUD
  const puntajeEl = $('hud-puntaje');
  const vidasEl   = $('hud-vidas');
  const modoBadge = $('hud-modo');
  if (puntajeEl) puntajeEl.textContent = '0';
  if (vidasEl)   vidasEl.textContent   = `0/${idiomasJuego.totalPreguntas}`;
  if (modoBadge) modoBadge.textContent = subModo === 'audio' ? '🔊 Idiomas · Audio' : '✍️ Idiomas · Escritura';

  // Inicializar barra de progreso en 0
  const progressFill  = $('progress-fill');
  const progressLabel = $('progress-label');
  if (progressFill)  { progressFill.style.width = '0%'; progressFill.style.background = ''; }
  if (progressLabel) progressLabel.textContent = `0 / ${idiomasJuego.totalPreguntas}`;

  const pregunta = idiomasJuego.generarPregunta();
  renderizarPreguntaIdioma(pregunta);

  idiomasJuego.iniciarTimer(
    seg => actualizarTimer(seg),
    ()  => onTiempoAgotadoIdioma(),
  );
}

// ── INICIALIZAR LISTENERS DEL MODAL DE IDIOMAS ───────────────

function inicializarIdiomasListeners() {
  const btnEscritura = $('btn-idiomas-escritura');
  const btnAudio     = $('btn-idiomas-audio');
  const btnCerrar    = $('btn-cerrar-idiomas-modal');
  const modal        = $('idiomas-modal');

  if (!btnEscritura || !btnAudio) return;

  btnEscritura.addEventListener('click', () => {
    cerrarIdiomasModal();
    iniciarJuegoIdiomas('escritura');
  });

  btnAudio.addEventListener('click', () => {
    cerrarIdiomasModal();
    iniciarJuegoIdiomas('audio');
  });

  btnCerrar?.addEventListener('click', cerrarIdiomasModal);
  modal?.addEventListener('click', e => {
    if (e.target === modal) cerrarIdiomasModal();
  });
}

function abrirIdiomasModal() {
  $('idiomas-modal')?.classList.add('open');
}

function cerrarIdiomasModal() {
  $('idiomas-modal')?.classList.remove('open');
}
