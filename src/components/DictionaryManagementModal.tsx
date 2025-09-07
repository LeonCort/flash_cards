import { useState, useEffect } from 'react';
import Modal from './Modal';
import './DictionaryManagementModal.css';

interface Dictionary {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  wordCount: number;
  createdAt: number;
}

interface DictionaryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  dictionaries: Dictionary[];
  onCreateDictionary: (data: { name: string; description?: string; color?: string }) => Promise<void>;
  onUpdateDictionary: (id: string, data: { name?: string; description?: string; color?: string }) => Promise<void>;
  onDeleteDictionary: (id: string) => Promise<void>;
  activeDictionaryId: string | null;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6b7280', // Gray
];

export default function DictionaryManagementModal({
  isOpen,
  onClose,
  dictionaries,
  onCreateDictionary,
  onUpdateDictionary,
  onDeleteDictionary,
  activeDictionaryId
}: DictionaryManagementModalProps) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingDictionary, setEditingDictionary] = useState<Dictionary | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: PRESET_COLORS[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('list');
      setEditingDictionary(null);
      setFormData({ name: '', description: '', color: PRESET_COLORS[0] });
      setError(null);
    }
  }, [isOpen]);

  const handleCreateNew = () => {
    setMode('create');
    setFormData({ name: '', description: '', color: PRESET_COLORS[0] });
    setError(null);
  };

  const handleEdit = (dictionary: Dictionary) => {
    setMode('edit');
    setEditingDictionary(dictionary);
    setFormData({
      name: dictionary.name,
      description: dictionary.description || '',
      color: dictionary.color || PRESET_COLORS[0]
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        throw new Error('Dictionary name is required');
      }

      const data = {
        name: trimmedName,
        description: formData.description.trim() || undefined,
        color: formData.color
      };

      if (mode === 'create') {
        await onCreateDictionary(data);
      } else if (mode === 'edit' && editingDictionary) {
        await onUpdateDictionary(editingDictionary._id, data);
      }

      setMode('list');
      setFormData({ name: '', description: '', color: PRESET_COLORS[0] });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (dictionary: Dictionary) => {
    if (dictionary.wordCount > 0) {
      setError('Cannot delete dictionary that contains words. Please move or delete all words first.');
      return;
    }

    if (dictionaries.length === 1) {
      setError('Cannot delete the last dictionary. You must have at least one dictionary.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${dictionary.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await onDeleteDictionary(dictionary._id);
      } catch (err: any) {
        setError(err.message || 'Failed to delete dictionary');
      }
    }
  };

  const renderList = () => (
    <div className="dictionary-list">
      <div className="dictionary-list-header">
        <h3>Manage Dictionaries</h3>
        <button
          className="btn btn--primary btn--sm"
          onClick={handleCreateNew}
        >
          ➕ Create New
        </button>
      </div>

      {dictionaries.length === 0 ? (
        <div className="empty-state">
          <p>No dictionaries found</p>
          <button
            className="btn btn--primary"
            onClick={handleCreateNew}
          >
            Create Your First Dictionary
          </button>
        </div>
      ) : (
        <div className="dictionary-items">
          {dictionaries.map((dictionary) => (
            <div
              key={dictionary._id}
              className={`dictionary-item ${
                dictionary._id === activeDictionaryId ? 'active' : ''
              }`}
            >
              <div className="dictionary-item-info">
                <div
                  className="dictionary-color"
                  style={{ backgroundColor: dictionary.color || '#3b82f6' }}
                />
                <div className="dictionary-details">
                  <h4>{dictionary.name}</h4>
                  {dictionary.description && (
                    <p className="dictionary-description">{dictionary.description}</p>
                  )}
                  <span className="dictionary-meta">
                    {dictionary.wordCount} words
                    {dictionary._id === activeDictionaryId && ' • Active'}
                  </span>
                </div>
              </div>
              <div className="dictionary-actions">
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => handleEdit(dictionary)}
                  title="Edit dictionary"
                >
                  ✏️
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => handleDelete(dictionary)}
                  title="Delete dictionary"
                  disabled={dictionary.wordCount > 0 || dictionaries.length === 1}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="dictionary-form">
      <div className="form-header">
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setMode('list')}
        >
          ← Back
        </button>
        <h3>{mode === 'create' ? 'Create Dictionary' : 'Edit Dictionary'}</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter dictionary name"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Color</label>
          <div className="color-picker">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-option ${formData.color === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
                title={color}
              />
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setMode('list')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="dictionary-management-modal"
    >
      {mode === 'list' ? renderList() : renderForm()}
    </Modal>
  );
}
