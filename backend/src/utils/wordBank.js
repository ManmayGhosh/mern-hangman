const fs = require('fs');
const wordListPath = require('word-list');

// `word-list` ships ~275,000 real English words (lowercase, alphabetic only,
// no proper nouns), one per line. We load it once at startup and keep a
// filtered, in-memory pool so every request is a cheap random pick with
// no network call and no repeated file I/O.
const MIN_LEN = 4;
const MAX_LEN = 11;

let pool = [];

function loadPool() {
  const raw = fs.readFileSync(wordListPath, 'utf8');
  const all = raw.split('\n');

  pool = all.filter((w) => {
    if (!w) return false;
    if (w.length < MIN_LEN || w.length > MAX_LEN) return false;
    // Guard against anything that slipped in with punctuation/apostrophes
    // (a handful of entries in the source list are possessive forms).
    return /^[a-z]+$/.test(w);
  });

  if (pool.length === 0) {
    throw new Error('Word pool is empty after filtering — check word-list install.');
  }

  console.log(`[wordBank] Loaded ${pool.length.toLocaleString()} candidate words (${MIN_LEN}-${MAX_LEN} letters).`);
}

function randomWord() {
  if (pool.length === 0) loadPool();
  const word = pool[Math.floor(Math.random() * pool.length)];
  return word.toUpperCase();
}

function poolSize() {
  return pool.length;
}

module.exports = { loadPool, randomWord, poolSize };
