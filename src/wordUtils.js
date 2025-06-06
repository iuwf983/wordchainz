let wordsArray = [];

export async function loadWords() {
  const res = await fetch('/words_alpha_clean.txt');
  const text = await res.text();
  wordsArray = text.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean);
}

export function getRandomWord(chainLength = 2, usedWords = []) {
  const maxAttempts = 100;
  for (let i = 0; i < maxAttempts; i++) {
    const word = wordsArray[Math.floor(Math.random() * wordsArray.length)];
    const prefix = word.slice(-chainLength);
    if (hasNextWord(prefix, [...usedWords, word])) {
      return word;
    }
  }
  return null;
}

export function isValidWord(word) {
  return wordsArray.includes(word.toLowerCase());
}

export function hasNextWord(prefix, usedWords) {
  return wordsArray.some(
    w => w.startsWith(prefix) && !usedWords.includes(w)
  );
}