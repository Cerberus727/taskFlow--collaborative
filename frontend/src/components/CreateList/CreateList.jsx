import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createList } from '../../store/slices/listSlice';
import { useAuth } from '../../context/AuthContext';
import './CreateList.css';

function CreateList({ boardId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const { token } = useSelector((state) => state.auth);
  const { requireAuth } = useAuth();

  const dispatch = useDispatch();

  const handleAddClick = () => {
    requireAuth(() => setIsAdding(true));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!token) {
      requireAuth(() => {});
      return;
    }

    try {
      await dispatch(createList({ boardId, title })).unwrap();
      setTitle('');
      setIsAdding(false);
    } catch (error) {
      console.error('[CreateList] Failed to create list:', error);
    }
  };

  if (!isAdding) {
    return (
      <div className="create-list-trigger">
        <button onClick={handleAddClick} className="add-list-btn">
          + Add list
        </button>
      </div>
    );
  }

  return (
    <div className="create-list-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="List title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div className="form-actions">
          <button type="submit" className="btn-add">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setTitle('');
            }}
            className="btn-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateList;
