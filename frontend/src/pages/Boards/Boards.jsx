import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBoards, createBoard, deleteBoard } from '../../store/slices/boardSlice';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Boards.css';

// Demo boards for non-authenticated users
const DEMO_BOARDS = [
  { id: 'demo-1', title: 'Project Alpha', description: 'Sample project board', lists: [], members: [] },
  { id: 'demo-2', title: 'Sprint Planning', description: 'Agile sprint management', lists: [], members: [] },
  { id: 'demo-3', title: 'Product Roadmap', description: 'Feature planning and timeline', lists: [], members: [] },
];

function Boards() {
  const [showModal, setShowModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { byId, allIds, loading } = useSelector((state) => state.board);
  const { user, token } = useSelector((state) => state.auth);
  const { requireAuth } = useAuth();
  
  const boards = token ? allIds.map(id => byId[id]) : DEMO_BOARDS;

  useEffect(() => {
    if (token) {
      dispatch(fetchBoards());
    }
  }, [dispatch, token]);

  const handleCreateBoardClick = () => {
    requireAuth(() => setShowModal(true));
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!token) {
      requireAuth(() => {});
      return;
    }
    const result = await dispatch(createBoard(newBoard));
    if (result.type === 'board/createBoard/fulfilled') {
      setNewBoard({ title: '', description: '' });
      setShowModal(false);
    }
  };

  const handleBoardClick = (boardId) => {
    if (boardId.startsWith('demo-')) {
      requireAuth(() => navigate(`/boards/${boardId}`));
    } else {
      navigate(`/boards/${boardId}`);
    }
  };

  const handleDeleteClick = (e, board) => {
    e.stopPropagation();
    setBoardToDelete(board);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (boardToDelete) {
      try {
        await dispatch(deleteBoard(boardToDelete.id)).unwrap();
        setShowDeleteModal(false);
        setBoardToDelete(null);
      } catch (error) {
        console.error('Failed to delete board:', error);
      }
    }
  };

  return (
    <div className="boards-page">
      <header className="boards-header">
        <div>
          <h1>{token ? 'My Boards' : 'Welcome to TaskFlow'}</h1>
          <p>{token ? `Welcome, ${user?.name}` : 'Login to create and manage your boards'}</p>
        </div>
        <div className="header-actions">
          <button onClick={handleCreateBoardClick} className="btn-primary">
            Create Board
          </button>
        </div>
      </header>

      {loading && token ? (
        <div className="loading">Loading boards...</div>
      ) : (
        <div className="boards-grid">
          {boards.length === 0 && token ? (
            <div className="empty-state">
              <p>No boards yet. Create your first board to get started!</p>
            </div>
          ) : (
            boards.map((board) => (
              <div
                key={board.id}
                className="board-card"
                onClick={() => handleBoardClick(board.id)}
              >
                <div className="board-card-header">
                  <h3>{board.title}</h3>
                  <div className="board-card-actions">
                    {board.isStarred && <span className="star-icon">⭐</span>}
                    {token && String(board.ownerId) === String(user?.id) && (
                      <button
                        className="delete-board-btn"
                        onClick={(e) => handleDeleteClick(e, board)}
                        title="Delete board"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <p>{board.description || 'No description'}</p>
                <div className="board-meta">
                  <span>{board.lists?.length || 0} lists</span>
                  <span>{board.members?.length || 0} members</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Board</h2>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={newBoard.title}
                  onChange={(e) =>
                    setNewBoard({ ...newBoard, title: e.target.value })
                  }
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newBoard.description}
                  onChange={(e) =>
                    setNewBoard({ ...newBoard, description: e.target.value })
                  }
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBoardToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Board?"
        message={`Are you sure you want to delete "${boardToDelete?.title}"? This action cannot be undone and will permanently delete all lists and tasks.`}
        confirmText="Delete Board"
        danger
      />
    </div>
  );
}

export default Boards;
