import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectBoardLabels,
  createLabel,
  updateLabel,
  deleteLabel,
} from '../../store/slices/labelsSlice';
import './LabelManager.css';

const COLORS = [
  '#61bd4f', // Green
  '#f2d600', // Yellow
  '#ff9f1a', // Orange
  '#eb5a46', // Red
  '#c377e0', // Purple
  '#0079bf', // Blue
  '#00c2e0', // Cyan
  '#51e898', // Lime
  '#ff78cb', // Pink
  '#344563', // Dark
];

function LabelManager({ boardId, onClose }) {
  const dispatch = useDispatch();
  const labels = useSelector((state) => selectBoardLabels(state, boardId));

  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await dispatch(createLabel({ boardId, name: newName.trim(), color: selectedColor })).unwrap();
      setNewName('');
    } catch (err) {
      console.error('Failed to create label:', err);
    }
    setLoading(false);
  };

  const handleStartEdit = (label) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await dispatch(updateLabel({ id: editingId, name: editName.trim(), color: editColor })).unwrap();
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update label:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this label? It will be removed from all cards.')) return;
    try {
      await dispatch(deleteLabel(id)).unwrap();
    } catch (err) {
      console.error('Failed to delete label:', err);
    }
  };

  return (
    <div className="label-manager-overlay" onClick={onClose}>
      <div className="label-manager" onClick={(e) => e.stopPropagation()}>
        <div className="label-manager-header">
          <h3>Labels</h3>
          <button className="label-manager-close" onClick={onClose}>×</button>
        </div>

        <div className="label-manager-body">
          {labels.length === 0 ? (
            <p className="empty-labels">No labels yet. Create one below!</p>
          ) : (
            <div className="labels-list">
              {labels.map((label) => (
                <div key={label.id} className="label-item">
                  {editingId === label.id ? (
                    <>
                      <input
                        type="text"
                        className="label-name-input"
                        style={{ flex: 1 }}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                      />
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        style={{ width: 32, height: 32, border: 'none', cursor: 'pointer' }}
                      />
                      <button className="label-edit-btn" onClick={handleSaveEdit}>✓</button>
                      <button className="label-edit-btn" onClick={() => setEditingId(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <div
                        className="label-color-preview"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </div>
                      <button
                        className="label-edit-btn"
                        onClick={() => handleStartEdit(label)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="label-delete-btn"
                        onClick={() => handleDelete(label.id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="create-label-section">
            <h4>Create New Label</h4>
            <div className="label-form">
              <input
                type="text"
                className="label-name-input"
                placeholder="Label name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="color-picker">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <button
                className="create-label-btn"
                onClick={handleCreate}
                disabled={!newName.trim() || loading}
              >
                {loading ? 'Creating...' : 'Create Label'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabelManager;
