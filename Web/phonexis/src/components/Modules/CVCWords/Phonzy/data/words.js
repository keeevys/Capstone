/**
 * Word bank for Phonzy, grouped by difficulty level.
 * Each level unlocks after the previous one is completed with hearts remaining.
 */

export const LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    subtitle: '3-letter CVC words',
    color: '#4D96FF',
    icon: '🐣',
    words: [
      { word: 'cat', icon: '🐱', hint: 'c-a-t' },
      { word: 'dog', icon: '🐶', hint: 'd-o-g' },
      { word: 'pig', icon: '🐷', hint: 'p-i-g' },
      { word: 'sun', icon: '☀️', hint: 's-u-n' },
      { word: 'pen', icon: '🖊️', hint: 'p-e-n' },
      { word: 'bat', icon: '🦇', hint: 'b-a-t' },
      { word: 'cup', icon: '🥤', hint: 'c-u-p' },
      { word: 'hen', icon: '🐔', hint: 'h-e-n' },
    ],
  },
  {
    id: 'easy',
    title: 'Easy',
    subtitle: '4-letter words',
    color: '#2ECC71',
    icon: '🐥',
    words: [
      { word: 'fish', icon: '🐟', hint: 'f-i-sh' },
      { word: 'hand', icon: '✋', hint: 'h-a-n-d' },
      { word: 'milk', icon: '🥛', hint: 'm-i-l-k' },
      { word: 'jump', icon: '🤸', hint: 'j-u-m-p' },
      { word: 'lamp', icon: '💡', hint: 'l-a-m-p' },
      { word: 'nest', icon: '🪺', hint: 'n-e-s-t' },
      { word: 'frog', icon: '🐸', hint: 'f-r-o-g' },
      { word: 'duck', icon: '🦆', hint: 'd-u-ck' },
    ],
  },
  {
    id: 'medium',
    title: 'Medium',
    subtitle: '5-6 letter words',
    color: '#F1C40F',
    icon: '🦊',
    words: [
      { word: 'apple', icon: '🍎', hint: 'ap-ple' },
      { word: 'rabbit', icon: '🐰', hint: 'rab-bit' },
      { word: 'basket', icon: '🧺', hint: 'bas-ket' },
      { word: 'monkey', icon: '🐒', hint: 'mon-key' },
      { word: 'pencil', icon: '✏️', hint: 'pen-cil' },
      { word: 'window', icon: '🪟', hint: 'win-dow' },
      { word: 'kitten', icon: '🐈', hint: 'kit-ten' },
      { word: 'purple', icon: '🟣', hint: 'pur-ple' },
    ],
  },
  {
    id: 'hard',
    title: 'Hard',
    subtitle: '7-8 letter words',
    color: '#FF6B6B',
    icon: '🦁',
    words: [
      { word: 'elephant', icon: '🐘', hint: 'el-e-phant' },
      { word: 'sandwich', icon: '🥪', hint: 'sand-wich' },
      { word: 'mountain', icon: '⛰️', hint: 'moun-tain' },
      { word: 'umbrella', icon: '☂️', hint: 'um-brel-la' },
      { word: 'triangle', icon: '🔺', hint: 'tri-an-gle' },
      { word: 'computer', icon: '💻', hint: 'com-pu-ter' },
      { word: 'sunshine', icon: '🌞', hint: 'sun-shine' },
      { word: 'backpack', icon: '🎒', hint: 'back-pack' },
    ],
  },
  {
    id: 'expert',
    title: 'Expert',
    subtitle: '8+ letter words',
    color: '#9B59B6',
    icon: '🐉',
    words: [
      { word: 'butterfly', icon: '🦋', hint: 'but-ter-fly' },
      { word: 'helicopter', icon: '🚁', hint: 'he-li-cop-ter' },
      { word: 'strawberry', icon: '🍓', hint: 'straw-ber-ry' },
      { word: 'basketball', icon: '🏀', hint: 'bas-ket-ball' },
      { word: 'watermelon', icon: '🍉', hint: 'wa-ter-mel-on' },
      { word: 'grasshopper', icon: '🦗', hint: 'grass-hop-per' },
      { word: 'caterpillar', icon: '🐛', hint: 'cat-er-pil-lar' },
      { word: 'skateboard', icon: '🛹', hint: 'skate-board' },
    ],
  },
];

export const getLevelById = (levelId) => LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];

export const getLevelIndex = (levelId) => LEVELS.findIndex((level) => level.id === levelId);
