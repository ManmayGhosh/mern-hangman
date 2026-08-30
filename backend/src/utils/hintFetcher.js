const fetch = require('node-fetch');

// Best-effort lookup of a short definition to use as a hint. Since the word
// pool is now a full dictionary rather than a curated list, we don't have
// hand-written hints anymore — this fills that gap when the API is reachable,
// and degrades gracefully (no hint) when it isn't, so gameplay never blocks
// on an external service.
async function fetchHint(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { timeout: 4000 }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const definition = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
    const partOfSpeech = data?.[0]?.meanings?.[0]?.partOfSpeech;

    if (!definition) return null;
    return partOfSpeech ? `(${partOfSpeech}) ${definition}` : definition;
  } catch (err) {
    return null; // network hiccup, timeout, or word not in the API's dataset
  }
}

module.exports = { fetchHint };
