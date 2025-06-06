import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { loadWords, getRandomWord, isValidWord, hasNextWord } from './wordUtils';
import useTheme from './useTheme';

export default function Game() {
  const [theme, setTheme] = useTheme();
  const [currentWord, setCurrentWord] = useState('');
  const [usedWords, setUsedWords] = useState([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [chainLength, setChainLength] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [wordsLoaded, setWordsLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [shake, setShake] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    loadWords().then(() => {
      loadHighScore(chainLength);
      startNewGame();
      setWordsLoaded(true);
    });
  }, []);

  useEffect(() => {
    loadHighScore(chainLength);
  }, [chainLength]);

  function loadHighScore(length) {
    const raw = localStorage.getItem('wordchainz_highscores');
    const scores = raw ? JSON.parse(raw) : {};
    setHighScore(scores[length] || 0);
  }

  function updateHighScoreIfNeeded(score, length) {
    const raw = localStorage.getItem('wordchainz_highscores');
    const scores = raw ? JSON.parse(raw) : {};
    if (!scores[length] || score > scores[length]) {
      scores[length] = score;
      localStorage.setItem('wordchainz_highscores', JSON.stringify(scores));
      setHighScore(score);
      showFeedback('🎉 New high score!', 'success');
      triggerConfetti();
    }
  }

  function triggerConfetti() {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }

  function startNewGame() {
    const start = getRandomWord();
    setCurrentWord(start);
    setUsedWords([start]);
    setScore(0);
    setInput('');
    setGameOver(false);
    setFeedbackMsg('');
    setFeedbackType('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (gameOver) return;

    const guess = input.trim().toLowerCase();
    const prefix = currentWord.slice(-chainLength);

    inputRef.current?.focus();

    if (!isValidWord(guess)) return handleInvalid('Word not found.');
    if (usedWords.includes(guess)) return handleInvalid('Word already used.');
    if (!guess.startsWith(prefix)) return handleInvalid(`Must start with "${prefix}".`);
    if (guess.length < chainLength) return handleInvalid(`At least ${chainLength} letters.`);

    const newScore = score + 1;
    setCurrentWord(guess);
    setUsedWords([...usedWords, guess]);
    setScore(newScore);
    setInput('');
    showFeedback('Word accepted!', 'success');

    if (!hasNextWord(guess.slice(-chainLength), [...usedWords, guess])) {
      setGameOver(true);
      updateHighScoreIfNeeded(newScore, chainLength);
      showFeedback('No more words available. Game over.', 'error');
    }
  }

  function handleInvalid(msg) {
    showFeedback(msg, 'error');
    setShake(true);
    setTimeout(() => setShake(false), 300);
  }

  function showFeedback(msg, type) {
    setFeedbackMsg(msg);
    setFeedbackType(type);
  }

  if (!wordsLoaded) return <div className="text-center mt-10 text-gray-700 dark:text-gray-300">Loading words...</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white flex items-center justify-center px-4 font-sans relative">
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        onClick={() => setSettingsOpen(true)}
        title="Settings"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 3v2.25M11.25 18.75V21M4.219 4.219l1.591 1.591M17.19 17.19l1.591 1.591M3 11.25h2.25M18.75 11.25H21M4.219 18.281l1.591-1.591M17.19 6.81l1.591-1.591" />
        </svg>
      </button>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg max-w-md w-full p-8 z-10">
        <h1 className="text-3xl font-semibold mb-4 text-teal-600">WordChainz</h1>

        <p className="mb-6 text-sm">
          Enter a word that starts with the last <strong>{chainLength}</strong> letter{chainLength !== 1 ? 's' : ''}.
        </p>

        <p className="mb-4 text-xl font-semibold">
          Current word: <span className="text-2xl text-teal-700 dark:text-teal-400">{currentWord}</span>
        </p>

        <p className="mb-4 text-lg">
          Score: <span className="font-semibold">{score}</span> | High score: <span className="font-semibold">{highScore}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
          <input
            type="text"
            className={`flex-grow border rounded px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition ${shake ? 'animate-shake' : ''}`}
            value={input} ref={inputRef}
            onChange={(e) => {
              setInput(e.target.value);
              setFeedbackMsg('');
              setFeedbackType('');
            }}
            disabled={gameOver}
            placeholder="Enter your word"
          />
          <button
            type="submit"
            disabled={gameOver}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded px-6 font-semibold transition py-2"
          >
            Submit
          </button>
        </form>

        <div className={`text-sm mt-1 h-5 ${feedbackType === 'error' ? 'text-red-500' : 'text-teal-600'}`}>{feedbackMsg}</div>

        <button
          onClick={startNewGame}
          className="w-full mt-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded px-6 py-2 font-semibold"
        >
          New Game
        </button>

        {gameOver && <p className="mt-6 text-red-600 font-semibold text-center">Game Over!</p>}
      </div>

      {settingsOpen && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-teal-600">Settings</h2>

            <label className="block mb-2 font-medium text-sm">Chain Length</label>
            <select
              value={chainLength}
              onChange={(e) => setChainLength(+e.target.value)}
              className="border rounded px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
              disabled={score > 0}
            >
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <label className="block mt-4 mb-2 font-medium text-sm">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="border rounded px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>

            <div className="mt-6 text-right">
              <button
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded font-medium"
                onClick={() => setSettingsOpen(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
