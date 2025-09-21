import { useEffect, useRef, useState } from 'react';

interface Dictionary {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  wordCount: number;
}

interface HeaderDictionaryDropdownProps {
  dictionaries: Dictionary[];
  activeDictionaryId: string | null;
  onSelect: (id: string) => void;
  onCreateNew?: () => void;
}

export default function HeaderDictionaryDropdown({
  dictionaries,
  activeDictionaryId,
  onSelect,
  onCreateNew
}: HeaderDictionaryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const active = dictionaries.find(d => d._id === activeDictionaryId) || dictionaries[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = query.trim()
    ? dictionaries.filter(d => d.name.toLowerCase().includes(query.toLowerCase()))
    : dictionaries;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="title-with-chip"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Select dictionary"
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <span className="chip" style={{ background: active?.color || '#3b82f6' }} aria-hidden="true" />
        <h3 className="title-text" style={{ marginRight: 6 }}>{active?.name || 'Dictionary'}</h3>
        <span className="title-count">{active?.wordCount ?? 0} {active?.wordCount === 1 ? 'word' : 'words'}</span>
        <span style={{ marginLeft: 8, opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Dictionaries"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: 260,
            background: 'var(--panel-bg)', /* ensure visible background on all themes */
            color: 'var(--panel-text)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: 'var(--elev)',
            backdropFilter: 'blur(8px)',
            zIndex: 100
          }}
        >
          <div style={{ padding: '8px 10px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dictionaries"
              aria-label="Search dictionaries"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--panel-text)' }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {filtered.map((d) => (
              <button
                key={d._id}
                role="option"
                aria-selected={d._id === activeDictionaryId}
                className={`dictionary-option ${d._id === activeDictionaryId ? 'active' : ''}`}
                onClick={() => { onSelect(d._id); setOpen(false); setQuery(''); }}
                style={{
                  display: 'flex', gap: 10, alignItems: 'center', width: '100%',
                  padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer'
                }}
              >
                <span className="dictionary-color" style={{ background: d.color || '#3b82f6', width: 8, height: 8, borderRadius: '50%' }} />
                <div className="dictionary-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="dictionary-name" style={{ fontWeight: 600 }}>{d.name}</span>
                  <span className="dictionary-count" style={{ fontSize: 12, opacity: 0.7 }}>{d.wordCount} words</span>
                </div>
              </button>
            ))}
          </div>
          {onCreateNew && (
            <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn--primary btn--sm"
                style={{ width: '100%' }}
                onClick={() => { setOpen(false); setQuery(''); onCreateNew(); }}
              >
⚙️ Manage dictionaries
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

