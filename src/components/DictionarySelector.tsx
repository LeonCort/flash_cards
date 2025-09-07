import { useState } from 'react';
import './DictionarySelector.css';

interface Dictionary {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  wordCount: number;
  createdAt: number;
}

interface DictionarySelectorProps {
  dictionaries: Dictionary[];
  activeDictionaryId: string | null;
  onDictionaryChange: (dictionaryId: string) => void;
  onCreateDictionary: () => void;
  onManageDictionaries: () => void;
}

export default function DictionarySelector({
  dictionaries,
  activeDictionaryId,
  onDictionaryChange,
  onCreateDictionary,
  onManageDictionaries
}: DictionarySelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeDictionary = dictionaries.find(d => d._id === activeDictionaryId);

  const handleDictionarySelect = (dictionaryId: string) => {
    onDictionaryChange(dictionaryId);
    setIsDropdownOpen(false);
  };

  if (dictionaries.length === 0) {
    return (
      <div className="dictionary-selector empty">
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <p>No dictionaries yet</p>
          <button 
            className="btn btn--primary btn--sm"
            onClick={onCreateDictionary}
          >
            Create Dictionary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dictionary-selector">
      <div className="dictionary-selector-header">
        <h3>Dictionary</h3>
        <div className="dictionary-actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={onCreateDictionary}
            title="Create new dictionary"
          >
            ➕
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={onManageDictionaries}
            title="Manage dictionaries"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="dictionary-dropdown">
        <button
          className={`dictionary-dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="dictionary-info">
            {activeDictionary ? (
              <>
                <div 
                  className="dictionary-color"
                  style={{ backgroundColor: activeDictionary.color || '#3b82f6' }}
                />
                <div className="dictionary-details">
                  <span className="dictionary-name">{activeDictionary.name}</span>
                  <span className="dictionary-count">
                    {activeDictionary.wordCount} words
                  </span>
                </div>
              </>
            ) : (
              <span className="dictionary-placeholder">Select a dictionary</span>
            )}
          </div>
          <span className="dropdown-arrow">▼</span>
        </button>

        {isDropdownOpen && (
          <div className="dictionary-dropdown-menu">
            {dictionaries.map((dictionary) => (
              <button
                key={dictionary._id}
                className={`dictionary-option ${
                  dictionary._id === activeDictionaryId ? 'active' : ''
                }`}
                onClick={() => handleDictionarySelect(dictionary._id)}
              >
                <div 
                  className="dictionary-color"
                  style={{ backgroundColor: dictionary.color || '#3b82f6' }}
                />
                <div className="dictionary-details">
                  <span className="dictionary-name">{dictionary.name}</span>
                  <span className="dictionary-count">
                    {dictionary.wordCount} words
                  </span>
                  {dictionary.description && (
                    <span className="dictionary-description">
                      {dictionary.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="dropdown-overlay"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
