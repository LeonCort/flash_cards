import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';


interface WordActionsMenuProps {
  wordId: string;
  wordText: string;
  onResetStats: (wordId: string) => void;
  onDeleteWord: (wordId: string) => void;
}

export default function WordActionsMenu({
  wordId,
  wordText,
  onResetStats,
  onDeleteWord
}: WordActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const MENU_WIDTH = 180;
  const MENU_HEIGHT = 120;

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const menuEl = document.getElementById(`wam-${wordId}`);
      if (anchorRef.current && (anchorRef.current === e.target || anchorRef.current.contains(e.target as Node))) return;
      if (menuEl && menuEl.contains(e.target as Node)) return;
      setOpen(false);
    };

    const handleReposition = () => {
      if (!anchorRef.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const openUp = spaceBelow < MENU_HEIGHT + 8;
      const top = openUp ? r.top - MENU_HEIGHT - 6 : r.bottom + 6;
      const left = Math.min(Math.max(r.right - MENU_WIDTH, 8), window.innerWidth - MENU_WIDTH - 8);
      setCoords({ top, left });
    };

    if (open) {
      handleReposition();
      document.addEventListener('mousedown', handleDocClick);
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
      return () => {
        document.removeEventListener('mousedown', handleDocClick);
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      };
    }
  }, [open, wordId]);

  const handleResetStats = () => {
    setOpen(false);
    if (confirm(`Reset statistics for "${wordText}"? This cannot be undone.`)) {
      onResetStats(wordId);
    }
  };

  const handleDeleteWord = () => {
    setOpen(false);
    if (confirm(`Delete "${wordText}" permanently? This cannot be undone.`)) {
      onDeleteWord(wordId);
    }
  };

  return (
    <div className="word-actions-menu">
      <button
        ref={anchorRef}
        className="btn btn--ghost btn--sm"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        title="More actions"
      >
        ⋯
      </button>
      {open && coords && createPortal(
        <div
          id={`wam-${wordId}`}
          className="word-actions-dropdown"
          style={{ position: 'fixed', top: coords.top, left: coords.left, right: 'auto', zIndex: 9999, width: MENU_WIDTH }}
        >
          <button
            className="dropdown-item"
            onClick={handleResetStats}
            title={`Reset statistics for "${wordText}"`}
          >
            🗑️ Clear stats
          </button>
          <button
            className="dropdown-item destructive"
            onClick={handleDeleteWord}
            title={`Delete "${wordText}" permanently`}
          >
            🗑️ Delete word
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
