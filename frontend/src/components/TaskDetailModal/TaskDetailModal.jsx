import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, deleteTask } from '../../store/slices/taskSlice';
import { updateTaskRealtime, deleteTaskRealtime } from '../../store/slices/boardSlice';
import {
  fetchComments,
  createComment,
  deleteComment,
  selectTaskComments,
  selectCommentsLoading,
} from '../../store/slices/commentsSlice';
import {
  selectBoardLabels,
  addLabelToTask,
  removeLabelFromTask,
} from '../../store/slices/labelsSlice';
import './TaskDetailModal.css';

function TaskDetailModal({ task, boardId, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const comments = useSelector((state) => selectTaskComments(state, task.id));
  const commentsLoading = useSelector(selectCommentsLoading);
  const boardLabels = useSelector((state) => selectBoardLabels(state, boardId));

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [newComment, setNewComment] = useState('');
  const [showLabelsMenu, setShowLabelsMenu] = useState(false);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [priority, setPriority] = useState(task.priority || 'MEDIUM');

  const titleRef = useRef(null);
  const descRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    dispatch(fetchComments({ taskId: task.id }));
  }, [dispatch, task.id]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingDescription && descRef.current) {
      descRef.current.focus();
    }
  }, [editingDescription]);

  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      dispatch(updateTaskRealtime({ id: task.id, title: title.trim() }));
      dispatch(updateTask({ id: task.id, title: title.trim() }));
    } else {
      setTitle(task.title);
    }
    setEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (description !== task.description) {
      dispatch(updateTaskRealtime({ id: task.id, description }));
      dispatch(updateTask({ id: task.id, description }));
    }
    setEditingDescription(false);
  };

  const handleDueDateChange = (value) => {
    setDueDate(value);
    const dueDateValue = value ? new Date(value).toISOString() : null;
    dispatch(updateTaskRealtime({ id: task.id, dueDate: dueDateValue }));
    dispatch(updateTask({ id: task.id, dueDate: dueDateValue }));
  };

  const handlePriorityChange = (value) => {
    setPriority(value);
    dispatch(updateTaskRealtime({ id: task.id, priority: value }));
    dispatch(updateTask({ id: task.id, priority: value }));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    dispatch(createComment({ taskId: task.id, content: newComment.trim() }));
    setNewComment('');
  };

  const handleDeleteComment = (commentId) => {
    dispatch(deleteComment(commentId));
  };

  const handleDelete = () => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      dispatch(deleteTaskRealtime({ taskId: task.id }));
      dispatch(deleteTask(task.id));
      onClose();
    }
  };

  const toggleLabel = (labelId) => {
    const hasLabel = task.taskLabels?.some((tl) => tl.labelId === labelId);
    const label = boardLabels.find((l) => l.id === labelId);
    
    if (hasLabel) {
      // Optimistic update - remove label
      const updatedTaskLabels = task.taskLabels.filter((tl) => tl.labelId !== labelId);
      dispatch(updateTaskRealtime({ id: task.id, taskLabels: updatedTaskLabels }));
      dispatch(removeLabelFromTask({ taskId: task.id, labelId }));
    } else {
      // Optimistic update - add label
      const newTaskLabel = { labelId, label };
      const updatedTaskLabels = [...(task.taskLabels || []), newTaskLabel];
      dispatch(updateTaskRealtime({ id: task.id, taskLabels: updatedTaskLabels }));
      dispatch(addLabelToTask({ taskId: task.id, labelId }));
    }
  };

  const taskLabels = task.taskLabels || [];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-detail-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <div className="modal-icon">📋</div>
          {editingTitle ? (
            <input
              ref={titleRef}
              type="text"
              className="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            />
          ) : (
            <h2 className="task-title" onClick={() => setEditingTitle(true)}>
              {task.title}
            </h2>
          )}
        </div>

        {taskLabels.length > 0 && (
          <div className="task-labels">
            {taskLabels.map((tl) => (
              <span
                key={tl.labelId}
                className="label-badge"
                style={{ backgroundColor: tl.label?.color || '#61bd4f' }}
              >
                {tl.label?.name}
              </span>
            ))}
          </div>
        )}

        <div className="modal-body">
          <div className="main-content">
            <section className="description-section">
              <div className="section-header">
                <span className="section-icon">📝</span>
                <h3>Description</h3>
              </div>
              {editingDescription ? (
                <div className="description-edit">
                  <textarea
                    ref={descRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    rows={4}
                  />
                  <div className="edit-actions">
                    <button className="btn-save" onClick={handleDescriptionSave}>
                      Save
                    </button>
                    <button className="btn-cancel" onClick={() => setEditingDescription(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`description-display ${!description ? 'empty' : ''}`}
                  onClick={() => setEditingDescription(true)}
                >
                  {description || 'Add a more detailed description...'}
                </div>
              )}
            </section>

            <section className="comments-section">
              <div className="section-header">
                <span className="section-icon">💬</span>
                <h3>Comments</h3>
              </div>

              <div className="comment-input">
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) handleAddComment();
                    }}
                  />
                  <button
                    className="btn-save"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="comments-list">
                {commentsLoading && comments.length === 0 && (
                  <div className="loading-comments">Loading comments...</div>
                )}
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.user?.name || 'Unknown'}</span>
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                      {comment.userId === user?.id && (
                        <button
                          className="delete-comment-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="sidebar">
            <h4>Add to card</h4>

            <div className="sidebar-item">
              <button className="sidebar-btn" onClick={() => setShowLabelsMenu(!showLabelsMenu)}>
                🏷️ Labels
              </button>
              {showLabelsMenu && (
                <div className="labels-menu">
                  {boardLabels.map((label) => (
                    <label key={label.id} className="label-option">
                      <input
                        type="checkbox"
                        checked={taskLabels.some((tl) => tl.labelId === label.id)}
                        onChange={() => toggleLabel(label.id)}
                      />
                      <span
                        className="label-color"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="label-name">{label.name}</span>
                    </label>
                  ))}
                  {boardLabels.length === 0 && (
                    <p className="no-labels">No labels available</p>
                  )}
                </div>
              )}
            </div>

            <div className="sidebar-item">
              <button className="sidebar-btn">
                📅 Due Date
              </button>
              <input
                type="date"
                className={`due-date-input ${isOverdue ? 'overdue' : ''}`}
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
              />
              {isOverdue && <span className="overdue-badge">Overdue</span>}
            </div>
            <div className="sidebar-item">
              <button className="sidebar-btn">
                🎯 Priority
              </button>
              <select
                className={`priority-select priority-${priority.toLowerCase()}`}
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
              >
                <option value="LOW">⚪ Low</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="HIGH">🔴 High</option>
              </select>
            </div>
            <div className="sidebar-item">
              <button className="sidebar-btn">
                🎯 Priority
              </button>
              <select
                className={`priority-select priority-${priority.toLowerCase()}`}
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <h4>Actions</h4>
            <button className="sidebar-btn danger" onClick={handleDelete}>
              🗑️ Delete
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;
