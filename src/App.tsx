import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import RoundStartModal from "./components/RoundStartModal";
import RoundCompleteModal from "./components/RoundCompleteModal";
import "./App.css";

function msFmt(ms: number | null | undefined) {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function App() {
  const words = useQuery(api.words.listWithStats) ?? [];
  const addWord = useMutation(api.words.add);
  const recordAttempt = useMutation(api.attempts.record);

  // Resets and rounds
  const resetStats = useMutation(api.words.resetStats);
  const startRound = useMutation(api.rounds?.start as any);
  const recordRound = useMutation(api.rounds?.record as any);

  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const roundState = useQuery(
    (api as any).rounds?.get,
    { roundId: activeRoundId }
  ) as any;

  const [repsPerWord, setRepsPerWord] = useState<number>(3);
  const [maxTimeMs, setMaxTimeMs] = useState<string>("");

  // Theme toggle
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") ?? "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Focus mode toggle
  const [focusMode, setFocusMode] = useState<boolean>(() => localStorage.getItem("focusMode") === "true");
  useEffect(() => {
    localStorage.setItem("focusMode", focusMode.toString());
  }, [focusMode]);

  // Modal states
  const [showRoundStartModal, setShowRoundStartModal] = useState(false);
  const [showRoundCompleteModal, setShowRoundCompleteModal] = useState(false);
  const [pendingRoundSettings, setPendingRoundSettings] = useState<{
    wordIds: string[];
    repsPerWord: number;
    maxTimeMs?: number;
  } | null>(null);

  // Quick-add form
  const [newWord, setNewWord] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const text = newWord.trim();
    if (!text) return;
    try {
      await addWord({ text });
      setNewWord("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to add word");
    }
  };

  // Current flashcard
  const activeWords = words;
  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentWord = useMemo(
    () => activeWords.find(w => w._id === currentId) ?? null,
    [activeWords, currentId]
  );

  // Timer
  const [now, setNow] = useState<number>(Date.now());
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const startTimer = () => {
    startRef.current = Date.now();
  };

  const elapsedMs = now - startRef.current;

  const chooseRandomWordId = () => {
    if (activeWords.length === 0) return null;
    const next = activeWords[Math.floor(Math.random() * activeWords.length)];
    return next._id as string;
  };

  // Prefer unsolved words when a round is active
  const chooseNextWordId = () => {
    if (activeRoundId && roundState?.items?.length) {
      const unsolved = roundState.items.filter((i: any) => !i.solved);
      if (unsolved.length) {
        const pick = unsolved[Math.floor(Math.random() * unsolved.length)];
        return pick.wordId as string;
      }
    }
    return chooseRandomWordId();
  };

  const goToRandomWord = () => {
    const id = chooseNextWordId();
    if (!id) {
      setCurrentId(null);
      return;
    }
    setCurrentId(id);
    startTimer();
  };

  useEffect(() => {
    // Pick an initial word once words arrive
    if (currentId === null && activeWords.length > 0) {
      goToRandomWord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWords.length]);

  // Flip animation state
  const [flipping, setFlipping] = useState(false);

  // Check if round is complete
  const isRoundComplete = activeRoundId && roundState?.round?.status === "done";

  // Auto-show round complete modal
  useEffect(() => {
    if (isRoundComplete) {
      setTimeout(() => {
        setShowRoundCompleteModal(true);
      }, 500);
    }
  }, [isRoundComplete]);

  const onNext = useCallback(async () => {
    if (!currentWord) return;
    const timeMs = Date.now() - startRef.current;

    if (activeRoundId) {
      await recordRound({ roundId: activeRoundId as any, wordId: currentWord._id, timeMs, correct: true });
    } else {
      await recordAttempt({ wordId: currentWord._id, correct: true, timeMs });
    }

    // Flip out, then change word, then flip in
    setFlipping(true);
    setTimeout(() => {
      goToRandomWord();
      setFlipping(false);
    }, 220); // should match CSS transition duration
  }, [currentWord, activeRoundId, recordRound, recordAttempt, goToRandomWord, setFlipping]);

  const onReset = () => {
    startTimer();
  };

  // Modal handlers
  const handleRoundStart = async () => {
    if (!pendingRoundSettings) return;

    const rid = await startRound({
      wordIds: pendingRoundSettings.wordIds,
      repsPerWord: pendingRoundSettings.repsPerWord,
      maxTimeMs: pendingRoundSettings.maxTimeMs
    } as any);

    setActiveRoundId(rid as any);
    setFocusMode(true); // Automatically enable focus mode when starting a round
    goToRandomWord();
    setPendingRoundSettings(null);
  };

  const handleContinuePracticing = () => {
    // Just close the modal, keep the current state
  };

  const handleStartNewRound = () => {
    setActiveRoundId(null);
    // Could optionally trigger the round start modal again
  };

  // Spacebar keyboard shortcut for Next button
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger on spacebar
      if (event.code !== 'Space') return;

      // Don't trigger if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Don't trigger if no current word
      if (!currentWord) return;

      // Prevent default spacebar behavior (page scroll)
      event.preventDefault();

      // Trigger the Next button
      onNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, onNext]);

  return (
    <div className={`layout ${focusMode ? "focus-mode" : ""}`}>
      <div className="topControls">
        <button
          className="themeToggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>
        <button
          className="focusToggle"
          onClick={() => setFocusMode(!focusMode)}
          aria-label="Toggle focus mode"
          title="Toggle focus mode"
        >
          {focusMode ? "Exit Focus" : "Focus"}
        </button>
      </div>

      <div className="leftPane">
        <h1>Flashcard</h1>
        {currentWord ? (
          <div className={`flashcard ${flipping ? "flipping" : ""}`}>
            {activeRoundId && roundState && (
              <div className="roundHUD">
                {isRoundComplete ? (
                  <span style={{ color: 'green', fontWeight: 'bold' }}>🎉 Round Complete!</span>
                ) : (
                  <>
                    Round • {roundState.solved}/{roundState.total} solved
                    {roundState.round?.repsPerWord && (
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        Goal: {roundState.round.repsPerWord} reps per word
                        {roundState.round.maxTimeMs && ` under ${roundState.round.maxTimeMs}ms`}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="word">{currentWord.text}</div>
            <div className="timer">{msFmt(elapsedMs)}</div>
            <div className="actions">
              <button
                className="next"
                onClick={onNext}
                title="Click or press Spacebar"
              >
                Next <span className="keyboard-hint">⎵</span>
              </button>
              <button className="reset" onClick={onReset}>
                Reset
              </button>
            </div>
          </div>
        ) : (
          <p>Add words to begin.</p>
        )}
      </div>

      <div className="rightPane">
        <h2>Dictionary</h2>
        <form className="addRow" onSubmit={onAdd}>
          <input
            placeholder="Add a word"
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            aria-label="New word"
          />
          <button type="submit">Add</button>
        </form>
        {error && <div className="error">{error}</div>}

        {/* Rounds and reset controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input type="number" min={1} value={repsPerWord} onChange={e => setRepsPerWord(+e.target.value)} placeholder="Reps/word" aria-label="Repetitions per word" />
          <input type="number" min={0} value={maxTimeMs} onChange={e => setMaxTimeMs(e.target.value)} placeholder="Max ms (optional)" aria-label="Max time in ms" />
          {!activeRoundId ? (
            <button onClick={() => {
              if (words.length === 0) {
                alert("Add some words first!");
                return;
              }
              const ids = words.map((w: any) => w._id);
              const maxMs = maxTimeMs.trim() ? Number(maxTimeMs) : undefined;
              setPendingRoundSettings({ wordIds: ids, repsPerWord, maxTimeMs: maxMs });
              setShowRoundStartModal(true);
            }}>Start round</button>
          ) : isRoundComplete ? (
            <button onClick={() => {
              setActiveRoundId(null);
              // Keep focus mode as user preference when round completes
            }} style={{ background: 'green', color: 'white' }}>
              🎉 Round Complete - Start New Round
            </button>
          ) : (
            <button onClick={() => {
              if (confirm("Are you sure you want to end this round early?")) {
                setActiveRoundId(null);
              }
            }}>End round early</button>
          )}
          <button onClick={() => resetStats({} as any)}>Reset all results</button>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Word</th>
                <th>Attempts</th>
                <th>Correct %</th>
                <th>Typical</th>
                <th>High score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w: any) => (
                <tr key={w._id}>
                  <td>{w.text}</td>
                  <td>{w.stats.total}</td>
                  <td>
                    {w.stats.correctRate == null
                      ? "—"
                      : `${Math.round(w.stats.correctRate * 100)}%`}
                  </td>
                  <td>{msFmt(w.stats.typicalTimeMs)}</td>
                  <td>{msFmt(w.stats.highScoreMs)}</td>
                  <td><button onClick={() => resetStats({ wordId: w._id } as any)}>Reset</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RoundStartModal
        isOpen={showRoundStartModal}
        onClose={() => setShowRoundStartModal(false)}
        onConfirm={handleRoundStart}
        wordCount={pendingRoundSettings?.wordIds.length || 0}
        repsPerWord={pendingRoundSettings?.repsPerWord || 0}
        maxTimeMs={pendingRoundSettings?.maxTimeMs}
      />

      <RoundCompleteModal
        isOpen={showRoundCompleteModal}
        onClose={() => setShowRoundCompleteModal(false)}
        onStartNewRound={handleStartNewRound}
        onContinuePracticing={handleContinuePracticing}
        solvedCount={roundState?.solved || 0}
        totalCount={roundState?.total || 0}
        repsPerWord={roundState?.round?.repsPerWord || 0}
        maxTimeMs={roundState?.round?.maxTimeMs}
      />
    </div>
  );
}
