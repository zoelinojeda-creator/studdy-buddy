function getAiKey() {
  return (storageGet(STORAGE_KEYS.aiKey) || '').trim();
}

function saveAiKey(key) {
  var value = (key || '').trim();
  if (value) storageSet(STORAGE_KEYS.aiKey, value);
  else storageRemove(STORAGE_KEYS.aiKey);
}

var GEMINI_MODEL = 'gemini-3.5-flash';

var SCHEMA_QUIZ = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question: { type: 'STRING' },
      options: { type: 'ARRAY', items: { type: 'STRING' } },
      correct: { type: 'INTEGER' },
      explanation: { type: 'STRING' }
    },
    required: ['question', 'options', 'correct']
  }
};
var SCHEMA_FLASH = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question: { type: 'STRING' },
      answer: { type: 'STRING' },
      explanation: { type: 'STRING' }
    },
    required: ['question', 'answer']
  }
};
var SCHEMA_COMPLETE = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      sentence: { type: 'STRING' },
      answer: { type: 'STRING' },
      explanation: { type: 'STRING' }
    },
    required: ['sentence', 'answer']
  }
};

function schemaFor(kind) {
  if (kind === 'flash') return SCHEMA_FLASH;
  if (kind === 'complete') return SCHEMA_COMPLETE;
  return SCHEMA_QUIZ;
}

function repairJson(s) {
  s = String(s || '').replace(/^\uFEFF/, '');
  s = s.replace(/[\u2018\u2019]/g, "'");
  s = s.replace(/[\u201C\u201D]/g, '"');
  s = s.replace(/,\s*([}\]])/g, '$1');
  return s;
}

function extractBalanced(s, openCh, closeCh) {
  var start = s.indexOf(openCh);
  if (start < 0) return null;
  var depth = 0, inStr = false, esc = false;
  for (var i = start; i < s.length; i++) {
    var c = s.charAt(i);
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === openCh) depth++;
    else if (c === closeCh) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function salvageArrayItems(s) {
  var start = s.indexOf('[');
  if (start < 0) return [];
  var items = [];
  var depth = 0, inStr = false, esc = false, objStart = -1;
  for (var i = start + 1; i < s.length; i++) {
    var c = s.charAt(i);
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && objStart >= 0) {
        try { items.push(JSON.parse(repairJson(s.slice(objStart, i + 1)))); }
        catch (e) {}
        objStart = -1;
      }
    } else if (c === ']' && depth === 0) break;
  }
  return items;
}

function parseAiJson(txt) {
  var clean = repairJson((txt || '').replace(/```(?:json)?/gi, '')).trim();
  var arr = extractBalanced(clean, '[', ']');
  if (arr) {
    try { return JSON.parse(repairJson(arr)); } catch (e) {}
  }
  var items = salvageArrayItems(clean);
  if (items.length) return items;
  var obj = extractBalanced(clean, '{', '}');
  if (obj) {
    try { return JSON.parse(repairJson(obj)); } catch (e) {}
  }
  throw new Error('JSON invalido de la IA');
}

function normalizeAiItems(method, data) {
  var items = Array.isArray(data) ? data : (data && (data.items || data.questions));
  if (!items || !items.length) return [];
  var out = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    if (method === 'complete') {
      if (!it.sentence || it.answer == null) continue;
      out.push({
        sentence: String(it.sentence),
        answer: String(it.answer),
        explanation: it.explanation ? String(it.explanation) : ''
      });
      continue;
    }
    if (method === 'flash') {
      if (!it.question || it.answer == null) continue;
      out.push({
        question: String(it.question),
        answer: String(it.answer),
        explanation: it.explanation ? String(it.explanation) : ''
      });
      continue;
    }
    if (!it.question) continue;
    var opts = it.options;
    if (typeof opts === 'string') opts = [opts];
    if (!opts || !opts.length) continue;
    var cor = it.correct;
    if (typeof cor === 'string') {
      var letter = cor.trim().toUpperCase();
      if (/^[A-D]$/.test(letter)) cor = letter.charCodeAt(0) - 65;
      else cor = parseInt(cor, 10);
    }
    if (typeof cor !== 'number' || isNaN(cor) || cor < 0 || cor >= opts.length) cor = 0;
    var mapped = [];
    for (var j = 0; j < opts.length; j++) mapped.push(String(opts[j]));
    out.push({
      question: String(it.question),
      options: mapped,
      correct: cor,
      explanation: it.explanation ? String(it.explanation) : ''
    });
  }
  return out;
}

function extractGeminiText(d) {
  var parts = d.candidates && d.candidates[0] &&
              d.candidates[0].content && d.candidates[0].content.parts;
  if (!parts || !parts.length) return '';
  var txt = '';
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].thought) continue;
    if (parts[i].text) txt += parts[i].text;
  }
  return txt;
}

function geminiErrorMessage(r, d) {
  var apiMsg = d && d.error && d.error.message;
  if (r.status === 404) return 'modelo no disponible';
  if (r.status === 400) return apiMsg || 'clave o pedido invalido';
  if (r.status === 403) return 'clave sin permiso';
  return apiMsg || ('HTTP ' + r.status);
}

function geminiGenerate(key, prompt, kind, extraCfg) {
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';
  var cfg = {
    temperature: 0.3,
        maxOutputTokens: 16384,
    responseMimeType: 'application/json',
    responseSchema: schemaFor(kind)
  };
  if (extraCfg) {
    for (var k in extraCfg) cfg[k] = extraCfg[k];
  }
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
      'x-goog-api-client': 'browser'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: cfg
    })
  }).then(function(r) {
    return r.json().catch(function() { return {}; }).then(function(d) {
      if (!r.ok) {
        var err = new Error(geminiErrorMessage(r, d));
        err.status = r.status;
        throw err;
      }
      return d;
    });
  });
}

function callAI(prompt, kind) {
  var key = getAiKey();
  if (!key) return Promise.reject(new Error('sin clave de IA'));

  console.log('[AI] Enviando prompt (' + prompt.length + ' chars) a ' + GEMINI_MODEL);
  return geminiGenerate(key, prompt, kind, { thinkingConfig: { thinkingLevel: 'minimal' } })
    .catch(function(err) {
      if (err && err.status === 400) {
        console.warn('[AI] Reintento sin thinkingConfig:', err.message);
        return geminiGenerate(key, prompt, kind, null);
      }
      throw err;
    })
    .then(function(d) {
      if (d.promptFeedback && d.promptFeedback.blockReason) {
        throw new Error('Bloqueado: ' + d.promptFeedback.blockReason);
      }
      var cand = d.candidates && d.candidates[0];
      var reason = cand && cand.finishReason;
      var txt = extractGeminiText(d);
      if (!txt) throw new Error(reason === 'MAX_TOKENS' ? 'respuesta cortada' : 'sin texto en respuesta');
      var parsed;
      try {
        parsed = parseAiJson(txt);
      } catch (e) {
        console.error('[AI] JSON crudo (recorte):', txt.slice(0, 400));
        throw e;
      }
      if (reason === 'MAX_TOKENS' && Array.isArray(parsed) && parsed.length) {
        console.warn('[AI] Respuesta cortada; se usan', parsed.length, 'items completos');
      }
      console.log('[AI] JSON parseado OK, items:', Array.isArray(parsed) ? parsed.length : parsed);
      return parsed;
    });
}

function cloneDemoItem(it, i) {
  var copy = {};
  for (var k in it) copy[k] = it[k];
  if (copy.options) copy.options = copy.options.slice();
  if (i > 0) {
    if (copy.question) copy.question = copy.question + ' (' + (i + 1) + ')';
    if (copy.sentence) copy.sentence = copy.sentence + ' (' + (i + 1) + ')';
  }
  return copy;
}

function getDemoData(method, subj, topic, count) {
  count = clampQuestionCount(count);
  var base;
  if (method === 'flash') {
    base = [
      {question:'Que es '+topic+'?', answer:topic+' es un concepto central de '+subj+'.', explanation:'Definicion principal.'},
      {question:'Cual es la importancia de '+topic+'?', answer:'Es base de '+subj+'.', explanation:'Relevancia en el area.'},
      {question:'Como se aplica '+topic+'?', answer:'En situaciones reales de '+subj+'.', explanation:'Aplicacion practica.'},
      {question:'Cuales son los elementos de '+topic+'?', answer:'Analisis, sintesis y evaluacion.', explanation:'Componentes basicos.'},
      {question:'Donde se estudia '+topic+'?', answer:'En la materia de '+subj+'.', explanation:'Marco academico.'}
    ];
  } else if (method === 'complete') {
    base = [
      {sentence:'El tema _____ pertenece a '+subj, answer:topic, explanation:'Tema central.'},
      {sentence:topic+' se puede _____ en la practica', answer:'aplicar', explanation:'Uso practico.'},
      {sentence:'La _____ es clave para aprender '+topic, answer:'practica', explanation:'La practica hace al maestro.'},
      {sentence:'Para dominar '+topic+' hay que _____ constantemente', answer:'practicar', explanation:'Clave del aprendizaje.'},
      {sentence:'En '+subj+' el concepto de _____ es esencial', answer:topic, explanation:'Tema esencial.'}
    ];
  } else {
    base = [
      {question:'Cual es el enfoque de '+topic+'?', options:['Teoria pura','Aplicacion en '+subj,'Matematica','Historia'], correct:1, explanation:'Se aplica en '+subj+'.'},
      {question:'En que area pertenece '+topic+'?', options:['Arte','Deportes',subj,'Cocina'], correct:2, explanation:'Parte de '+subj+'.'},
      {question:'Que necesitas para aprender '+topic+'?', options:['Solo memoria','Solo teoria','Practica y teoria','Nada'], correct:2, explanation:'Ambas son necesarias.'},
      {question:'Como impacta '+topic+' en tu aprendizaje?', options:['No impacta','Negativamente','Positivamente','A veces'], correct:2, explanation:'Impacto positivo en '+subj+'.'},
      {question:'Donde se usa '+topic+'?', options:['En ningun lugar','Solo en examenes','En la vida real','Solo laboratorios'], correct:2, explanation:'Tiene aplicaciones reales.'}
    ];
  }
  var out = [];
  for (var i = 0; i < count; i++) {
    out.push(cloneDemoItem(base[i % base.length], Math.floor(i / base.length)));
  }
  return out;
}

function fitQuestionCount(items, count, method, subj, topic) {
  count = clampQuestionCount(count);
  items = items ? items.slice() : [];
  if (items.length >= count) return items.slice(0, count);
  var demo = getDemoData(method, subj, topic, count);
  var i = 0;
  while (items.length < count && i < demo.length) {
    items.push(demo[i]);
    i++;
  }
  return items.slice(0, count);
}
