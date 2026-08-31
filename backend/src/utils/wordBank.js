const fs = require('fs');
const path = require('path');

// Real system dictionaries (installed via apt in the Dockerfile — see
// "wamerican-large" there). These give tens of thousands of genuine English
// words with zero npm dependency, so there's no package export format to
// break across versions and no network call at runtime.
const SYSTEM_DICT_CANDIDATES = [
  '/usr/share/dict/american-english-large',
  '/usr/share/dict/american-english',
  '/usr/share/dict/words',
  '/usr/share/dict/british-english',
];

// Guaranteed-available fallback for any environment without a system
// dictionary (e.g. local Windows/Mac dev outside Docker). Smaller, but
// the app never crashes for lack of a word source.
const FALLBACK_WORDS = require('../../data/fallbackWords.js');

const MIN_LEN = 4;
const MAX_LEN = 11;

let pool = [];
let source = 'none';

function filterWords(words) {
  return words.filter((w) => {
    if (!w) return false;
    const trimmed = w.trim();
    if (trimmed.length < MIN_LEN || trimmed.length > MAX_LEN) return false;
    // Only accept plain lowercase alphabetic entries — this naturally
    // excludes possessives/contractions ("cat's") and most proper nouns
    // (which system dictionaries capitalize, e.g. "France").
    return /^[a-z]+$/.test(trimmed);
  });
}

function loadPool() {
  for (const dictPath of SYSTEM_DICT_CANDIDATES) {
    try {
      if (!fs.existsSync(dictPath)) continue;
      const raw = fs.readFileSync(dictPath, 'utf8');
      const filtered = filterWords(raw.split('\n'));
      if (filtered.length > 0) {
        pool = filtered;
        source = dictPath;
        console.log(`[wordBank] Loaded ${pool.length.toLocaleString()} words from ${dictPath}.`);
        return;
      }
    } catch (err) {
      console.warn(`[wordBank] Could not read ${dictPath}:`, err.message);
    }
  }

  // No system dictionary found or usable — fall back to the embedded list.
  pool = filterWords(FALLBACK_WORDS);
  source = 'embedded fallback list';
  console.log(
    `[wordBank] No system dictionary found — using embedded fallback (${pool.length.toLocaleString()} words). ` +
      'This is expected outside Docker; the Docker image installs a full system dictionary at build time.'
  );

  if (pool.length === 0) {
    // Should be unreachable since the fallback list is bundled and checked
    // in, but fail loudly rather than silently serving no game at all.
    throw new Error('Word pool is empty — both system dictionary and embedded fallback failed to load.');
  }
}

function randomWord() {
  if (pool.length === 0) loadPool();
  const word = pool[Math.floor(Math.random() * pool.length)];
  return word.toUpperCase();
}

function poolSize() {
  return pool.length;
}

function poolSource() {
  return source;
}

module.exports = { loadPool, randomWord, poolSize, poolSource };
