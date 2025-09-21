import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import RoundStartModal, { type WordSource } from "./components/RoundStartModal";
import RoundCompleteModal from "./components/RoundCompleteModal";

import FocusFlashcard from "./components/FocusFlashcard";
import DictionaryGrid from "./components/DictionaryGrid";
import DictionaryManagementModal from "./components/DictionaryManagementModal";
import HeaderDictionaryDropdown from "./components/HeaderDictionaryDropdown";
import AddWordModal from "./components/AddWordModal";
import Toast from "./components/Toast";
import { useToast } from "./hooks/useToast";
import "./App.css";

import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";

function msFmt(ms: number | null | undefined) {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function App() {
  // Auth and device identity
  const { signIn, signOut } = useAuthActions();
  const authToken = useAuthToken();
  const isAuthed = !!authToken;
  const [deviceId] = useState<string>(() => {
    try {
      let id = localStorage.getItem("deviceId");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("deviceId", id);
      }
      return id as string;
    } catch {
      // Fallback if localStorage is unavailable
      return "anon";
    }
  });

  // Dictionary state management
  const [activeDictionaryId, setActiveDictionaryId] = useState<string | null>(() =>
    localStorage.getItem("activeDictionaryId")
  );

  const dictionaries = useQuery(api.dictionaries.list) ?? [];
  const firstDictionary = useQuery(api.dictionaries.getFirstDictionary);
  const activeDictionary = useMemo(() =>
    (dictionaries || []).find((d: any) => d._id === activeDictionaryId) || null,
  [dictionaries, activeDictionaryId]);

  // Auto-select first dictionary if none is selected
  useEffect(() => {
    if (!activeDictionaryId && firstDictionary) {
      setActiveDictionaryId(firstDictionary._id);
    }
  }, [activeDictionaryId, firstDictionary]);

  // Persist active dictionary selection
  useEffect(() => {
    if (activeDictionaryId) {
      localStorage.setItem("activeDictionaryId", activeDictionaryId);
    }
  }, [activeDictionaryId]);

  const words = useQuery(
    api.words.listWithStats,
    activeDictionaryId ? { dictionaryId: activeDictionaryId as any } : "skip"
  ) ?? [];

  const addWord = useMutation(api.words.add);
  const recordAttempt = useMutation(api.attempts.record);
  const toast = useToast();

  // Dictionary management
  const createDictionary = useMutation(api.dictionaries.create);
  const updateDictionary = useMutation(api.dictionaries.update);
  const deleteDictionary = useMutation(api.dictionaries.remove);

  // Resets and rounds
  const resetStats = useMutation(api.words.resetStats);
  const startRound = useMutation(api.rounds?.start as any);
  const recordRound = useMutation(api.rounds?.record as any);

  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const roundState = useQuery(
    (api as any).rounds?.get,
    { roundId: activeRoundId }
  ) as any;



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

  // Streak tracking
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  const [sessionAttempts, setSessionAttempts] = useState<number>(0);
  const [sessionCorrect, setSessionCorrect] = useState<number>(0);

  // Word selection for training rounds
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());

  // Dictionary view toggle
  const [dictionaryView, setDictionaryView] = useState<'table' | 'grid'>(() =>
    (localStorage.getItem("dictionaryView") as 'table' | 'grid') ?? 'grid'
  );

  useEffect(() => {
    localStorage.setItem("dictionaryView", dictionaryView);
  }, [dictionaryView]);

  // Dictionary filters
  const [dictionaryFilter, setDictionaryFilter] = useState<'all' | 'non-cleared' | 'not-tested' | 'difficult'>('all');

  // Word selection functions

  // Header "More" dropdown
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggleWordSelection = (wordId: string) => {
    setSelectedWordIds(prev => {
      const newSet = new Set(prev);

      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  const selectAllWords = () => {
    setSelectedWordIds(new Set(filteredWords.map((w: any) => w._id)));
  };

  const clearWordSelection = () => {
    setSelectedWordIds(new Set());
  };

  // Filter words based on selected filter
  const filteredWords = useMemo(() => {
    if (dictionaryFilter === 'all') return words;

    return words.filter((w: any) => {
      const maxMs = 3000; // Default 3 second threshold for difficult words

      switch (dictionaryFilter) {
        case 'non-cleared':
          // Words that haven't cleared the time limit (no high score or high score > maxTime)
          return !w.stats.highScoreMs || w.stats.highScoreMs > maxMs;

        case 'not-tested':
          // Words with no attempts
          return w.stats.total === 0;

        case 'difficult':
          // Words with attempts but poor performance (low accuracy or slow typical time)
          if (w.stats.total === 0) return false;
          const accuracy = w.stats.correctRate ? w.stats.correctRate * 100 : 0;
          const isSlowTypical = w.stats.typicalTimeMs && w.stats.typicalTimeMs > maxMs;
          return accuracy < 70 || isSlowTypical;

        default:
          return true;
      }
    });
  }, [words, dictionaryFilter]);

  // Get selected words for training
  const selectedWords = filteredWords.filter((w: any) => selectedWordIds.has(w._id));
  const wordsToTrain = selectedWords.length > 0 ? selectedWords : filteredWords;

  // Helper function to get words by source
  const getWordsBySource = (source: WordSource) => {
    const maxMs = 3000; // Default 3 second threshold for difficult words

    switch (source) {
      case 'all':
        return words;
      case 'non-cleared':
        return words.filter((w: any) => !w.stats.highScoreMs || w.stats.highScoreMs > maxMs);
      case 'difficult':
        return words.filter((w: any) => {
          if (w.stats.total === 0) return false;
          const accuracy = w.stats.correctRate ? w.stats.correctRate * 100 : 0;
          const isSlowTypical = w.stats.typicalTimeMs && w.stats.typicalTimeMs > maxMs;
          return accuracy < 70 || isSlowTypical;
        });
      case 'custom':
        return selectedWords;
      default:
        return [];
    }
  };

  // Calculate word counts for modal
  const wordCounts = {
    all: words.length,
    nonCleared: words.filter((w: any) => !w.stats.highScoreMs || w.stats.highScoreMs > 3000).length,
    difficult: words.filter((w: any) => {
      if (w.stats.total === 0) return false;
      const accuracy = w.stats.correctRate ? w.stats.correctRate * 100 : 0;
      const isSlowTypical = w.stats.typicalTimeMs && w.stats.typicalTimeMs > 3000;
      return accuracy < 70 || isSlowTypical;
    }).length,
    custom: selectedWords.length
  };

  // Modal states
  const [showRoundStartModal, setShowRoundStartModal] = useState(false);
  const [showRoundCompleteModal, setShowRoundCompleteModal] = useState(false);
  const [showDictionaryManagementModal, setShowDictionaryManagementModal] = useState(false);
  const [showAddWordModal, setShowAddWordModal] = useState(false);

  // Add word handler (used by modal)
  const onAddWord = async (text: string) => {
    const word = text.trim();
    if (!word) return;
    if (!activeDictionaryId) {
      toast.error("Please select a dictionary first");
      return;
    }
    try {
      await addWord({ text: word, dictionaryId: activeDictionaryId as any });
      toast.success(`Added "${word}" to ${activeDictionary?.name ?? 'dictionary'}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add word");
      throw err;
    }
  };

  // Dictionary management handlers
  const handleCreateDictionary = async (data: { name: string; description?: string; color?: string }) => {
    try {
      const dictionaryId = await createDictionary(data);
      toast.success(`Created dictionary "${data.name}"`);
      setActiveDictionaryId(dictionaryId as any);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create dictionary");
      throw err;
    }
  };

  const handleUpdateDictionary = async (id: string, data: { name?: string; description?: string; color?: string }) => {
    try {
      await updateDictionary({ dictionaryId: id as any, ...data });
      toast.success("Dictionary updated successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update dictionary");
      throw err;
    }
  };

  const handleDeleteDictionary = async (id: string) => {
    try {
      await deleteDictionary({ dictionaryId: id as any });
      toast.success("Dictionary deleted successfully");

      // If we deleted the active dictionary, switch to the first available one
      if (id === activeDictionaryId) {
        const remainingDictionaries = dictionaries.filter(d => d._id !== id);
        if (remainingDictionaries.length > 0) {
          setActiveDictionaryId(remainingDictionaries[0]._id);
        } else {
          setActiveDictionaryId(null);
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete dictionary");
      throw err;
    }
  };

  // Current flashcard - use selected words if any are selected
  const activeWords = wordsToTrain;
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
    // Pick an initial word once words arrive or when activeWords change
    if (activeWords.length > 0) {
      // If no current word or current word is not in the active words, pick a new one
      if (currentId === null || !activeWords.find(w => w._id === currentId)) {
        goToRandomWord();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWords, currentId]);

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
      await recordAttempt({ wordId: currentWord._id, correct: true, timeMs, sessionId: isAuthed ? undefined : deviceId });
    }

    // Update streak and accuracy - only increment streak if time limit is met
    const maxTime = roundState?.round?.maxTimeMs;
    const metTimeLimit = !maxTime || timeMs <= maxTime;

    if (metTimeLimit) {
      setCurrentStreak(prev => prev + 1);
    } else {
      setCurrentStreak(0); // Reset streak if time limit exceeded
    }

    setSessionAttempts(prev => prev + 1);
    setSessionCorrect(prev => prev + 1);


    // Flip out, then change word, then flip in
    setFlipping(true);
    setTimeout(() => {
      goToRandomWord();
      setFlipping(false);
    }, 220); // should match CSS transition duration
  }, [currentWord, activeRoundId, recordRound, recordAttempt, goToRandomWord, setFlipping, sessionCorrect, sessionAttempts, roundState]);

  const onReset = () => {
    startTimer();
  };

  // Function to handle incorrect answers (resets streak)



  // Modal handlers
  const handleRoundStart = async (settings: { repsPerWord: number; maxTimeMs?: number; wordSource: WordSource }) => {
    const wordsForRound = getWordsBySource(settings.wordSource);
    if (wordsForRound.length === 0) return;

    const wordIds = wordsForRound.map((w: any) => w._id);

    const rid = await startRound({
      wordIds,
      repsPerWord: settings.repsPerWord,
      maxTimeMs: settings.maxTimeMs
    } as any);

    setActiveRoundId(rid as any);
    setFocusMode(true); // Automatically enable focus mode when starting a round

    // Reset session stats
    setCurrentStreak(0);

    setSessionAttempts(0);
    setSessionCorrect(0);

    goToRandomWord();
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
    <>
      <header className="header">
        <div className="header-title">
          <h1>Flashcards</h1>
          {activeRoundId && (
            <div className="round-status">
              <span className="round-indicator">🎯 Round Active</span>
              {roundState?.round && (
                <span className="round-progress">
                  {roundState.round.repsPerWord} reps per word
                  {roundState.round.maxTimeMs && ` • ${(roundState.round.maxTimeMs / 1000).toFixed(1)}s limit`}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="header-controls">
          {activeRoundId && (
            <button
              className="btn btn--danger btn--sm"
              onClick={() => {
                if (confirm("Are you sure you want to end this round early?")) {
                  setActiveRoundId(null);
                  setFocusMode(false);
                }
              }}
              title="End current round"
            >
              End Round
            </button>
          )}
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            className={`btn btn--sm ${focusMode ? "btn--destructive" : "btn--primary"}`}
            onClick={() => setFocusMode(!focusMode)}
            aria-label="Toggle focus mode"
            title="Toggle focus mode"
          >
            {focusMode ? "Exit Focus" : "Focus"}
          </button>
        </div>
      </header>

      <div className={`layout ${focusMode ? "focus-mode" : ""}`}>

      <div className="leftPane">
{currentWord ? (
          focusMode && activeRoundId ? (
            <FocusFlashcard
              word={currentWord.text}
              elapsedMs={elapsedMs}
              onNext={onNext}
              onReset={onReset}
              flipping={flipping}
              roundState={roundState}
              streak={currentStreak}
            />
          ) : (
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
              <div className="timer-container">
                <div className="timer">{msFmt(elapsedMs)}</div>
                {roundState?.round?.maxTimeMs && (
                  <div className="timer-progress">
                    <div
                      className="timer-progress-bar"
                      style={{
                        width: `${Math.min((elapsedMs / roundState.round.maxTimeMs) * 100, 100)}%`,
                        backgroundColor: elapsedMs > roundState.round.maxTimeMs ? 'var(--destructive)' : 'var(--primary)'
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="actions">
                <button
                  className="btn btn--primary btn--lg"
                  onClick={onNext}
                  title="Click or press Spacebar"
                >
                  Next <span className="keyboard-hint">⎵</span>
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={onReset}
                >
                  Reset
                </button>
              </div>
            </div>
          )
        ) : (
          <p>Add words to begin.</p>
        )}
      </div>

      <div className="rightPane">

        {/* Word List Card */}
        <div className="management-card" style={{ borderTop: `3px solid ${activeDictionary?.color || 'var(--accent)'}` }}>
          <div className="card-header">
            <HeaderDictionaryDropdown
              dictionaries={dictionaries}
              activeDictionaryId={activeDictionaryId}
              onSelect={setActiveDictionaryId}
              onCreateNew={() => setShowDictionaryManagementModal(true)}
            />
            <div className="header-actions">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setShowAddWordModal(true)}
                title={`Add a word to “${activeDictionary?.name ?? 'Dictionary'}”`}
                disabled={!activeDictionaryId}
              >
                + Add Word
              </button>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setShowRoundStartModal(true)}
                title={`Practice in “${activeDictionary?.name ?? 'Dictionary'}”`}
              >
                Practice
              </button>
              <div className="view-toggle">
                <button
                  className={`view-btn ${dictionaryView === 'table' ? 'active' : ''}`}
                  onClick={() => setDictionaryView('table')}
                  title="Table view"
                >
                  📋
                </button>
                <button
                  className={`view-btn ${dictionaryView === 'grid' ? 'active' : ''}`}
                  onClick={() => setDictionaryView('grid')}
                  title="Grid view"
                >
                  ⊞
                </button>
              </div>
              <div className="more-menu" ref={moreRef}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setMoreOpen(o => !o)}
                  aria-expanded={moreOpen}
                  title="More actions"
                >
                  ⋯
                </button>
                {moreOpen && (
                  <div className="dropdown">
                    {!isAuthed ? (
                      <form
                        className="dropdown-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          void signIn("resend", formData);
                          setMoreOpen(false);
                        }}
                      >
                        <input name="email" type="email" placeholder="Email" required />
                        <button className="dropdown-item" type="submit">Send sign-in link</button>
                      </form>
                    ) : (
                      <button
                        className="dropdown-item"
                        onClick={() => { setMoreOpen(false); void signOut(); }}
                        title="Sign out"
                      >
                        ↪ Sign out
                      </button>
                    )}
                    <button
                      className="dropdown-item destructive"
                      onClick={() => {
                        setMoreOpen(false);
                        if (confirm(`Reset stats in "${activeDictionary?.name ?? 'this dictionary'}"? This cannot be undone.`)) {
                          resetStats({ dictionaryId: activeDictionaryId } as any);
                        }
                      }}
                      title={`Reset all word statistics in "${activeDictionary?.name ?? 'this dictionary'}"`}
                      disabled={words.length === 0}
                    >
                      🗑️ Reset Stats in {activeDictionary?.name ?? 'Dictionary'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="filter-buttons">
                <button
                  className={`filter-btn ${dictionaryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDictionaryFilter('all')}
                  title="Show all words"
                >
                  All ({words.length})
                </button>
                <button
                  className={`filter-btn ${dictionaryFilter === 'non-cleared' ? 'active' : ''}`}
                  onClick={() => setDictionaryFilter('non-cleared')}
                  title="Words that haven't cleared the time limit"
                >
                  Non-cleared
                </button>
                <button
                  className={`filter-btn ${dictionaryFilter === 'not-tested' ? 'active' : ''}`}
                  onClick={() => setDictionaryFilter('not-tested')}
                  title="Words with no attempts yet"
                >
                  Not tested
                </button>
                <button
                  className={`filter-btn ${dictionaryFilter === 'difficult' ? 'active' : ''}`}
                  onClick={() => setDictionaryFilter('difficult')}
                  title="Words with low accuracy or slow typical time"
                >
                  Difficult
                </button>

              </div>

            {/* Word Selection Info & Bulk Actions */}
            <div className="selection-controls">
              {selectedWords.length > 0 ? (
                <div className="word-selection-info">
                  <span className="selection-count">
                    {selectedWords.length} of {filteredWords.length} words selected
                  </span>
                  <button
                    className="clear-selection-btn"
                    onClick={clearWordSelection}
                    title="Clear selection"
                  >
                    Clear Selection
                  </button>
                </div>
              ) : dictionaryView === 'grid' && filteredWords.length > 0 && (
                <div className="bulk-selection">
                </div>
              )}
            </div>




            {dictionaryView === 'table' ? (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedWordIds.size === filteredWords.length && filteredWords.length > 0}
                          onChange={(e) => e.target.checked ? selectAllWords() : clearWordSelection()}
                          title="Select all words"
                        />
                      </th>
                      <th>Word</th>
                      <th>Attempts</th>
                      <th>Correct %</th>
                      <th>Typical</th>
                      <th>High score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>

                    {filteredWords.map((w: any) => (
                      <tr key={w._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedWordIds.has(w._id)}
                            onChange={() => toggleWordSelection(w._id)}
                            title={`Select "${w.text}"`}
                          />
                        </td>
                        <td>{w.text}</td>
                        <td>{w.stats.total}</td>
                        <td>
                          {w.stats.correctRate == null
                            ? "—"
                            : `${Math.round(w.stats.correctRate * 100)}%`}
                        </td>
                        <td>{msFmt(w.stats.typicalTimeMs)}</td>
                        <td>{msFmt(w.stats.highScoreMs)}</td>
                        <td>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => resetStats({ wordId: w._id } as any)}
                            title="Reset statistics for this word"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <DictionaryGrid
                words={filteredWords}
                selectedWordIds={selectedWordIds}
                onToggleSelection={toggleWordSelection}
                onReset={(wordId) => resetStats({ wordId } as any)}
                maxTimeMs={3000}
              />
            )}
          </div>
        </div>


      </div>

      {/* Modals */}
      <RoundStartModal
        isOpen={showRoundStartModal}
        onClose={() => setShowRoundStartModal(false)}
        onConfirm={handleRoundStart}
        wordCounts={wordCounts}
        getWordsBySource={getWordsBySource}
        hasSelectedWords={selectedWordIds.size > 0}
        currentFilter={dictionaryFilter}
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


      <AddWordModal
        isOpen={showAddWordModal}
        onClose={() => setShowAddWordModal(false)}
        onSubmit={onAddWord}
        dictionaryName={activeDictionary?.name || null}
      />

      <DictionaryManagementModal
        isOpen={showDictionaryManagementModal}
        onClose={() => setShowDictionaryManagementModal(false)}
        dictionaries={dictionaries}
        onCreateDictionary={handleCreateDictionary}
        onUpdateDictionary={handleUpdateDictionary}
        onDeleteDictionary={handleDeleteDictionary}
        activeDictionaryId={activeDictionaryId}
      />

      {/* Toast Notifications */}
      <Toast toasts={toast.toasts} onRemove={toast.removeToast} />
      </div>
    </>
  );
}
