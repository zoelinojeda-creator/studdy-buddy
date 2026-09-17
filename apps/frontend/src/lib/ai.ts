// Puerto de docs/js/ai.js — misma logica de generacion, parseo tolerante de
// JSON, reintentos ante 503 y clasificacion de errores. No se reinventa
// nada: se traduce tal cual a TypeScript.

const AI_KEY_STORAGE = 'sb_ai_key'

// localStorage (no Zustand, no sessionStorage de invitado): es una
// preferencia de DISPOSITIVO, no de cuenta — mismo criterio que docs/js
// (sb_ai_key nunca se borra al cerrar sesion). Si alguien usa docs/ y este
// frontend en el mismo navegador, la clave se comparte gratis.
export function getAiKey(): string {
  try {
    return (localStorage.getItem(AI_KEY_STORAGE) || '').trim()
  } catch {
    return ''
  }
}

export function saveAiKey(key: string): void {
  const value = (key || '').trim()
  try {
    if (value) localStorage.setItem(AI_KEY_STORAGE, value)
    else localStorage.removeItem(AI_KEY_STORAGE)
  } catch {
    // localStorage no disponible — no es critico, solo no persiste.
  }
}

export type Metodo = 'flash' | 'quiz' | 'complete' | 'rapid'

export interface FlashItem {
  question: string
  answer: string
  explanation: string
}
export interface CompleteItem {
  sentence: string
  answer: string
  explanation: string
}
export interface QuizItem {
  question: string
  options: string[]
  correct: number
  explanation: string
}
export type Pregunta = FlashItem | CompleteItem | QuizItem

export type AiErrorType = 'invalid_key' | 'capacity' | 'unknown'

export class AiRequestError extends Error {
  status?: number
  errorType?: AiErrorType
  displayMessage?: string
}

const GEMINI_MODEL = 'gemini-3.6-flash'
const GEMINI_MODEL_FALLBACK = 'gemini-3.5-flash-lite'
const GEMINI_503_RETRIES = 2
const GEMINI_503_RETRY_DELAY_MS = 1500

// Mismo Edge Function que ya usa docs/ (dynamic-handler) — no se toca, solo
// se llama desde aca. URL armada con las env vars que ya existen en este
// frontend en vez de hardcodear el proyecto como hace ai.js.
function edgeFunctionUrl(): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dynamic-handler`
}

const SCHEMA_QUIZ = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question: { type: 'STRING' },
      options: { type: 'ARRAY', items: { type: 'STRING' } },
      correct: { type: 'INTEGER' },
      explanation: { type: 'STRING' },
    },
    required: ['question', 'options', 'correct'],
  },
}
const SCHEMA_FLASH = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question: { type: 'STRING' },
      answer: { type: 'STRING' },
      explanation: { type: 'STRING' },
    },
    required: ['question', 'answer'],
  },
}
const SCHEMA_COMPLETE = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      sentence: { type: 'STRING' },
      answer: { type: 'STRING' },
      explanation: { type: 'STRING' },
    },
    required: ['sentence', 'answer'],
  },
}

function schemaFor(kind: Metodo) {
  if (kind === 'flash') return SCHEMA_FLASH
  if (kind === 'complete') return SCHEMA_COMPLETE
  return SCHEMA_QUIZ
}

// === Prompts (docs/js/screens/material.js promptMap, palabra por palabra) ===
export function buildPrompt(method: Metodo, subj: string, topic: string, count: number): string {
  const promptMap: Record<Metodo, string> = {
    flash:
      'Eres un asistente educativo. Genera exactamente ' +
      count +
      ' flashcards sobre el tema "' +
      topic +
      '" de la materia "' +
      subj +
      '".' +
      '\nResponde UNICAMENTE con un array JSON valido, sin texto extra, sin backticks, sin markdown. Formato exacto:' +
      '\nNo uses comillas dobles dentro de los textos; usa comillas simples si hace falta.' +
      '\n[{"question":"pregunta","answer":"respuesta completa","explanation":"explicacion breve de por que es correcta"}]',
    rapid:
      'Eres un asistente educativo. Genera exactamente ' +
      count +
      ' preguntas de opcion multiple, cortas y aptas para responder en 10 segundos, sobre el tema "' +
      topic +
      '" de la materia "' +
      subj +
      '".' +
      '\nCada pregunta debe tener 4 opciones donde solo una es correcta. El campo "correct" es el indice 0-3 de la opcion correcta.' +
      '\nNo uses comillas dobles dentro de los textos; usa comillas simples si hace falta.' +
      '\nResponde UNICAMENTE con un array JSON valido, sin texto extra, sin backticks, sin markdown. Formato exacto:' +
      '\n[{"question":"pregunta","options":["opcion A","opcion B","opcion C","opcion D"],"correct":0,"explanation":"por que la opcion correcta es correcta"}]',
    quiz:
      'Eres un asistente educativo. Genera exactamente ' +
      count +
      ' preguntas de opcion multiple sobre el tema "' +
      topic +
      '" de la materia "' +
      subj +
      '".' +
      '\nCada pregunta debe tener 4 opciones donde solo una es correcta. El campo "correct" es el indice 0-3 de la opcion correcta.' +
      '\nNo uses comillas dobles dentro de los textos; usa comillas simples si hace falta.' +
      '\nResponde UNICAMENTE con un array JSON valido, sin texto extra, sin backticks, sin markdown. Formato exacto:' +
      '\n[{"question":"pregunta","options":["opcion A","opcion B","opcion C","opcion D"],"correct":0,"explanation":"por que la opcion correcta es correcta"}]',
    complete:
      'Eres un asistente educativo. Genera exactamente ' +
      count +
      ' oraciones para completar sobre el tema "' +
      topic +
      '" de la materia "' +
      subj +
      '".' +
      '\nEn cada oracion usa exactamente _____ (cinco guiones bajos) donde va la palabra o frase que falta.' +
      '\nResponde UNICAMENTE con un array JSON valido, sin texto extra, sin backticks, sin markdown. Formato exacto:' +
      '\nNo uses comillas dobles dentro de los textos; usa comillas simples si hace falta.' +
      '\n[{"sentence":"La _____ fue la causa principal de...","answer":"respuesta exacta","explanation":"explicacion breve"}]',
  }
  return promptMap[method] || promptMap.quiz
}

// === Parseo tolerante de JSON (docs/js/ai.js, char por char, sin cambios) ===
function repairJson(s: string): string {
  s = String(s || '').replace(/^﻿/, '')
  s = s.replace(/[‘’]/g, "'")
  s = s.replace(/[“”]/g, '"')
  s = s.replace(/,\s*([}\]])/g, '$1')
  return s
}

function extractBalanced(s: string, openCh: string, closeCh: string): string | null {
  const start = s.indexOf(openCh)
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < s.length; i++) {
    const c = s.charAt(i)
    if (inStr) {
      if (esc) {
        esc = false
        continue
      }
      if (c === '\\') {
        esc = true
        continue
      }
      if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === openCh) depth++
    else if (c === closeCh) {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

function salvageArrayItems(s: string): unknown[] {
  const start = s.indexOf('[')
  if (start < 0) return []
  const items: unknown[] = []
  let depth = 0
  let inStr = false
  let esc = false
  let objStart = -1
  for (let i = start + 1; i < s.length; i++) {
    const c = s.charAt(i)
    if (inStr) {
      if (esc) {
        esc = false
        continue
      }
      if (c === '\\') {
        esc = true
        continue
      }
      if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === '{') {
      if (depth === 0) objStart = i
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0 && objStart >= 0) {
        try {
          items.push(JSON.parse(repairJson(s.slice(objStart, i + 1))))
        } catch {
          // item invalido, se descarta
        }
        objStart = -1
      }
    } else if (c === ']' && depth === 0) break
  }
  return items
}

function parseAiJson(txt: string): unknown {
  const clean = repairJson((txt || '').replace(/```(?:json)?/gi, '')).trim()
  const arr = extractBalanced(clean, '[', ']')
  if (arr) {
    try {
      return JSON.parse(repairJson(arr))
    } catch {
      // sigue con el resto de las estrategias de rescate
    }
  }
  const items = salvageArrayItems(clean)
  if (items.length) return items
  const obj = extractBalanced(clean, '{', '}')
  if (obj) {
    try {
      return JSON.parse(repairJson(obj))
    } catch {
      // sigue al throw final
    }
  }
  throw new Error('JSON invalido de la IA')
}

// === Normalizacion por metodo (docs/js/ai.js normalizeAiItems, sin cambios) ===
function normalizeAiItems(method: Metodo, data: unknown): Pregunta[] {
  const raw = data as Record<string, unknown>
  const items = Array.isArray(data) ? data : (raw?.items ?? raw?.questions)
  if (!Array.isArray(items) || !items.length) return []

  const out: Pregunta[] = []
  for (const it of items as Record<string, unknown>[]) {
    if (!it || typeof it !== 'object') continue

    if (method === 'complete') {
      if (!it.sentence || it.answer == null) continue
      out.push({
        sentence: String(it.sentence),
        answer: String(it.answer),
        explanation: it.explanation ? String(it.explanation) : '',
      })
      continue
    }

    if (method === 'flash') {
      if (!it.question || it.answer == null) continue
      out.push({
        question: String(it.question),
        answer: String(it.answer),
        explanation: it.explanation ? String(it.explanation) : '',
      })
      continue
    }

    if (!it.question) continue
    let opts = it.options as unknown
    if (typeof opts === 'string') opts = [opts]
    if (!Array.isArray(opts) || !opts.length) continue

    let cor: unknown = it.correct
    if (typeof cor === 'string') {
      const letter = cor.trim().toUpperCase()
      if (/^[A-D]$/.test(letter)) cor = letter.charCodeAt(0) - 65
      else cor = parseInt(cor, 10)
    }
    if (typeof cor !== 'number' || isNaN(cor) || cor < 0 || cor >= opts.length) cor = 0

    out.push({
      question: String(it.question),
      options: opts.map((o) => String(o)),
      correct: cor,
      explanation: it.explanation ? String(it.explanation) : '',
    })
  }
  return out
}

export function fitQuestionCount(items: Pregunta[], count: number): Pregunta[] {
  return items.length > count ? items.slice(0, count) : items
}

// === Llamada a Gemini (docs/js/ai.js, sin cambios de logica) ===
function extractGeminiText(d: any): string {
  const parts = d?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts) || !parts.length) return ''
  let txt = ''
  for (const p of parts) {
    if (p.thought) continue
    if (p.text) txt += p.text
  }
  return txt
}

function geminiErrorMessage(status: number, d: any): string {
  const apiMsg = d?.error?.message
  if (status === 404) return 'modelo no disponible'
  if (status === 400) return apiMsg || 'clave o pedido invalido'
  if (status === 403) return 'clave sin permiso'
  return apiMsg || `HTTP ${status}`
}

export function classifyAiError(err: unknown): AiRequestError {
  if (!err) return new AiRequestError('Error desconocido')
  const e = err as AiRequestError
  if (!e.errorType) {
    if (e.status === 400 && /api key not valid/i.test(e.message || '')) {
      e.errorType = 'invalid_key'
    } else {
      e.errorType = 'unknown'
    }
  }
  return e
}

// Mismos 3 mensajes que genErrorMessage() en docs/js/screens/material.js.
export function mensajeDeError(err: unknown): string {
  const e = err as AiRequestError
  if (e?.displayMessage) return e.displayMessage
  const t = e?.errorType
  if (t === 'invalid_key') {
    return 'Tu clave de Gemini no funciona en este momento (puede estar mal escrita, vencida, o sin cuota disponible). Revisala e intenta de nuevo, o borrala para usar la IA compartida de StudyBuddy.'
  }
  if (t === 'capacity') {
    return 'No hay disponibilidad en nuestra API compartida debido a carga excesiva de preguntas. Podes ingresar tu clave personal de Gemini para continuar.'
  }
  const motivo = e?.message ? e.message : String(err)
  return `Hubo un problema generando las preguntas (${motivo}). Intenta de nuevo en un momento.`
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function geminiGenerate(
  key: string,
  prompt: string,
  kind: Metodo,
  extraCfg: Record<string, unknown> | null,
  model: string,
): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const cfg: Record<string, unknown> = {
    temperature: 0.3,
    maxOutputTokens: 16384,
    responseMimeType: 'application/json',
    responseSchema: schemaFor(kind),
  }
  if (extraCfg) Object.assign(cfg, extraCfg)

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
      'x-goog-api-client': 'browser',
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: cfg }),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      const err = new AiRequestError(geminiErrorMessage(r.status, d))
      err.status = r.status
      throw err
    }
    return d
  })
}

// Reintenta la misma llamada a Gemini cuando responde 503 (servicio saturado).
function geminiGenerateWithRetry(
  key: string,
  prompt: string,
  kind: Metodo,
  extraCfg: Record<string, unknown> | null,
  model: string,
  retriesLeft: number,
): Promise<any> {
  return geminiGenerate(key, prompt, kind, extraCfg, model).catch((err) => {
    if (err?.status === 503 && retriesLeft > 0) {
      return wait(GEMINI_503_RETRY_DELAY_MS).then(() =>
        geminiGenerateWithRetry(key, prompt, kind, extraCfg, model, retriesLeft - 1),
      )
    }
    throw err
  })
}

// Sin clave propia: pasa por el Edge Function (usa la clave de Gemini del
// servidor). Devuelve la respuesta cruda de Gemini, mismo formato que
// geminiGenerate() — dynamic-handler no se toca, solo se llama.
function edgeFunctionGenerate(prompt: string, kind: Metodo): Promise<any> {
  return fetch(edgeFunctionUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ prompt, kind }),
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      if (d?.error === 'capacity') {
        const capErr = new AiRequestError(d.message || 'No hay disponibilidad en nuestra API debido a carga excesiva de preguntas.')
        capErr.errorType = 'capacity'
        throw capErr
      }
      throw new Error(d?.message || `HTTP ${r.status}`)
    }
    return d
  })
}

function callAI(prompt: string, kind: Metodo): Promise<unknown> {
  const key = getAiKey()
  let source: Promise<any>

  if (key) {
    source = geminiGenerateWithRetry(
      key,
      prompt,
      kind,
      { thinkingConfig: { thinkingLevel: 'minimal' } },
      GEMINI_MODEL,
      GEMINI_503_RETRIES,
    )
      .catch((err) => {
        if (err?.status === 400) {
          return geminiGenerateWithRetry(key, prompt, kind, null, GEMINI_MODEL, GEMINI_503_RETRIES)
        }
        throw err
      })
      .catch((err) => {
        if (err?.status === 503) {
          return geminiGenerateWithRetry(
            key,
            prompt,
            kind,
            { thinkingConfig: { thinkingLevel: 'minimal' } },
            GEMINI_MODEL_FALLBACK,
            0,
          ).catch((fallbackErr) => {
            // Misma red de seguridad que ya tiene el modelo principal: si el
            // respaldo tampoco soporta thinkingConfig, un intento mas sin el
            // antes de darse por vencido del todo.
            if (fallbackErr?.status === 400) {
              return geminiGenerateWithRetry(key, prompt, kind, null, GEMINI_MODEL_FALLBACK, 0)
            }
            throw fallbackErr
          })
        }
        throw err
      })
  } else {
    source = edgeFunctionGenerate(prompt, kind)
  }

  return source
    .then((d) => {
      if (d.promptFeedback?.blockReason) {
        throw new Error('Bloqueado: ' + d.promptFeedback.blockReason)
      }
      const cand = d.candidates?.[0]
      const reason = cand?.finishReason
      const txt = extractGeminiText(d)
      if (!txt) throw new Error(reason === 'MAX_TOKENS' ? 'respuesta cortada' : 'sin texto en respuesta')
      return parseAiJson(txt)
    })
    .catch((err) => {
      throw classifyAiError(err)
    })
}

// === Datos de demo — red de seguridad si la IA no devuelve nada usable ===
function cloneDemoItem(it: Record<string, unknown>, i: number): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...it }
  if (Array.isArray(copy.options)) copy.options = [...copy.options]
  if (i > 0) {
    if (copy.question) copy.question = `${copy.question} (${i + 1})`
    if (copy.sentence) copy.sentence = `${copy.sentence} (${i + 1})`
  }
  return copy
}

function getDemoData(method: Metodo, subj: string, topic: string, count: number): Pregunta[] {
  let base: Record<string, unknown>[]
  if (method === 'flash') {
    base = [
      { question: `Que es ${topic}?`, answer: `${topic} es un concepto central de ${subj}.`, explanation: 'Definicion principal.' },
      { question: `Cual es la importancia de ${topic}?`, answer: `Es base de ${subj}.`, explanation: 'Relevancia en el area.' },
      { question: `Como se aplica ${topic}?`, answer: `En situaciones reales de ${subj}.`, explanation: 'Aplicacion practica.' },
      { question: `Cuales son los elementos de ${topic}?`, answer: 'Analisis, sintesis y evaluacion.', explanation: 'Componentes basicos.' },
      { question: `Donde se estudia ${topic}?`, answer: `En la materia de ${subj}.`, explanation: 'Marco academico.' },
    ]
  } else if (method === 'complete') {
    base = [
      { sentence: `El tema _____ pertenece a ${subj}`, answer: topic, explanation: 'Tema central.' },
      { sentence: `${topic} se puede _____ en la practica`, answer: 'aplicar', explanation: 'Uso practico.' },
      { sentence: `La _____ es clave para aprender ${topic}`, answer: 'practica', explanation: 'La practica hace al maestro.' },
      { sentence: `Para dominar ${topic} hay que _____ constantemente`, answer: 'practicar', explanation: 'Clave del aprendizaje.' },
      { sentence: `En ${subj} el concepto de _____ es esencial`, answer: topic, explanation: 'Tema esencial.' },
    ]
  } else {
    base = [
      { question: `Cual es el enfoque de ${topic}?`, options: ['Teoria pura', `Aplicacion en ${subj}`, 'Matematica', 'Historia'], correct: 1, explanation: `Se aplica en ${subj}.` },
      { question: `En que area pertenece ${topic}?`, options: ['Arte', 'Deportes', subj, 'Cocina'], correct: 2, explanation: `Parte de ${subj}.` },
      { question: `Que necesitas para aprender ${topic}?`, options: ['Solo memoria', 'Solo teoria', 'Practica y teoria', 'Nada'], correct: 2, explanation: 'Ambas son necesarias.' },
      { question: `Como impacta ${topic} en tu aprendizaje?`, options: ['No impacta', 'Negativamente', 'Positivamente', 'A veces'], correct: 2, explanation: `Impacto positivo en ${subj}.` },
      { question: `Donde se usa ${topic}?`, options: ['En ningun lugar', 'Solo en examenes', 'En la vida real', 'Solo laboratorios'], correct: 2, explanation: 'Tiene aplicaciones reales.' },
    ]
  }
  const out: Record<string, unknown>[] = []
  for (let i = 0; i < count; i++) {
    out.push(cloneDemoItem(base[i % base.length], Math.floor(i / base.length)))
  }
  return out as unknown as Pregunta[]
}

// === Punto de entrada usado por useEstudioStore ===
export async function generarPreguntas(method: Metodo, subj: string, topic: string, count: number): Promise<Pregunta[]> {
  const prompt = buildPrompt(method, subj, topic, count)
  const data = await callAI(prompt, method)
  let items = fitQuestionCount(normalizeAiItems(method, data), count)

  if (!items.length) {
    const emptyErr = new AiRequestError('sin preguntas validas')
    emptyErr.errorType = 'unknown'
    emptyErr.displayMessage = 'La IA no genero preguntas validas para este tema. Intenta de nuevo o proba con otro tema.'
    throw emptyErr
  }

  // Red de seguridad: si algun bug futuro dejara items vacio pese a los
  // chequeos de arriba, no entrar a jugar sin preguntas.
  if (!items.length) items = getDemoData(method, subj, topic, count)
  return items
}
