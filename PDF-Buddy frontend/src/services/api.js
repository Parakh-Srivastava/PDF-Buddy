/**
 * API service for PDF-Buddy / ContextFlow Executive
 * Connects to Flask backend (default http://127.0.0.1:5000)
 */

export const DEFAULT_API_BASE = 'http://127.0.0.1:5000';

// Clean initial state (starts empty on page load/reload)
export const INITIAL_CORPUS_DATA = {
  filename: null,
  charCount: 0,
  mode: null,
  collectionName: null,
  topK: 5,
  chunksCount: 0,
  chunksProcessed: 0,
  repeatedHeadersStripped: 0,
  model: 'gemini-1.5 / gpt-4o',
  latencyMs: null,
  tokensSynthesized: null,
  chunks: []
};

export const INITIAL_CONVERSATION = [];

export const QUICK_PROMPTS = [
  '📑 Provide an Executive Summary',
  '🔍 Key revenue drivers & metrics',
  '⚠️ Primary risks and bottlenecks',
  '📈 Growth & future projections'
];

/**
 * Check if the Flask backend is live
 */
export async function checkBackendHealth(baseUrl = DEFAULT_API_BASE) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${baseUrl}/active_corpus`, {
      method: 'GET',
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeoutId);
    return res !== null;
  } catch {
    return false;
  }
}

/**
 * Fetch active corpus info from Flask backend
 */
export async function getActiveCorpusApi(baseUrl = DEFAULT_API_BASE) {
  try {
    const res = await fetch(`${baseUrl}/active_corpus`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    return null;
  }
  return null;
}


/**
 * Upload a PDF file to the Flask backend
 */
export async function uploadPdfApi(file, baseUrl = DEFAULT_API_BASE) {
  const formData = new FormData();
  formData.append('pdf', file);

  const res = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Upload failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Ask a question against the active PDF
 */
export async function askQuestionApi(question, model = 'llama3.2:3b', baseUrl = DEFAULT_API_BASE) {
  const startTime = performance.now();
  const res = await fetch(`${baseUrl}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question, model })
  });

  const latency = Math.round(performance.now() - startTime);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    ...data,
    latencyMs: latency
  };
}


