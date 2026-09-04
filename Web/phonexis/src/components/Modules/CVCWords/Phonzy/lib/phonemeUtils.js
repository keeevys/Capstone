/**
 * Lightweight, rule-based grapheme-to-phoneme (G2P) approximation.
 *
 * This is intentionally isolated from the scorer so it can be swapped for a
 * real phoneme model/dictionary later (e.g. CMUdict lookup or a WASM
 * forced-aligner) without touching any other part of the game. Everything
 * downstream only depends on `wordToPhonemes(word) -> string[]`.
 */

const MULTI_LETTER_RULES = [
  ['tch', 'CH'],
  ['dge', 'JH'],
  ['igh', 'AY'],
  ['eigh', 'AY'],
  ['sh', 'SH'],
  ['ch', 'CH'],
  ['th', 'TH'],
  ['ph', 'F'],
  ['wh', 'W'],
  ['ng', 'NG'],
  ['ck', 'K'],
  ['qu', 'KW'],
  ['ai', 'AY'],
  ['ay', 'AY'],
  ['ee', 'IY'],
  ['ea', 'IY'],
  ['oa', 'OW'],
  ['ow', 'OW'],
  ['ou', 'AW'],
  ['oo', 'UW'],
  ['oy', 'OY'],
  ['oi', 'OY'],
  ['ar', 'AR'],
  ['er', 'ER'],
  ['ir', 'ER'],
  ['or', 'AOR'],
  ['ur', 'ER'],
  ['au', 'AO'],
  ['aw', 'AO'],
];

const SINGLE_LETTER_RULES = {
  a: 'AE',
  b: 'B',
  c: 'K',
  d: 'D',
  e: 'EH',
  f: 'F',
  g: 'G',
  h: 'HH',
  i: 'IH',
  j: 'JH',
  k: 'K',
  l: 'L',
  m: 'M',
  n: 'N',
  o: 'AA',
  p: 'P',
  q: 'K',
  r: 'R',
  s: 'S',
  t: 'T',
  u: 'AH',
  v: 'V',
  w: 'W',
  x: 'KS',
  y: 'IY',
  z: 'Z',
};

/**
 * Converts a plain word into an approximate phoneme token sequence.
 * @param {string} word
 * @returns {string[]}
 */
export function wordToPhonemes(word) {
  if (!word) return [];

  let clean = String(word).toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return [];

  // Silent trailing "e" (cake, bike, cute) — drop it before tokenizing.
  if (clean.length > 3 && clean.endsWith('e') && /[bcdfghjklmnpqrstvwxyz]/.test(clean[clean.length - 2])) {
    clean = clean.slice(0, -1);
  }

  const phonemes = [];
  let i = 0;
  while (i < clean.length) {
    let matched = false;
    for (const [pattern, phoneme] of MULTI_LETTER_RULES) {
      if (clean.startsWith(pattern, i)) {
        phonemes.push(phoneme);
        i += pattern.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const letter = clean[i];
    phonemes.push(SINGLE_LETTER_RULES[letter] || letter.toUpperCase());
    i += 1;
  }

  return phonemes;
}

/**
 * Generic Levenshtein edit distance over arrays (works for phoneme tokens
 * or characters, since strings can be split into arrays).
 */
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const matrix = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= n; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = 1 + Math.min(
          matrix[i - 1][j - 1],
          matrix[i - 1][j],
          matrix[i][j - 1],
        );
      }
    }
  }

  return matrix[m][n];
}

/**
 * Similarity in [0, 1] between two arrays based on edit distance.
 */
export function arraySimilarity(a, b) {
  if (a.length === 0 && b.length === 0) return 1;
  const distance = editDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

/**
 * Character-level similarity between two raw strings.
 */
export function textSimilarity(a, b) {
  const left = String(a || '').toLowerCase().trim();
  const right = String(b || '').toLowerCase().trim();
  if (!left || !right) return 0;
  if (left === right) return 1;
  return arraySimilarity(left.split(''), right.split(''));
}

/**
 * Phoneme-level similarity between two words. More forgiving of
 * spelling-vs-sound mismatches than plain text comparison, e.g. a
 * recognizer hearing "fyi" for "phi" still lines up phonetically.
 */
export function phoneticSimilarity(targetWord, spokenText) {
  const targetPhonemes = wordToPhonemes(targetWord);
  const spokenPhonemes = wordToPhonemes(spokenText);
  return arraySimilarity(targetPhonemes, spokenPhonemes);
}
