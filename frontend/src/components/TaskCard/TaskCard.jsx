import { Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateTask, deleteTask } from '../../store/slices/taskSlice';
import { updateTaskRealtime, deleteTaskRealtime } from '../../store/slices/boardSlice';
import TaskDetailModal from '../TaskDetailModal';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import './TaskCard.css';

function TaskCard({ task, index, boardId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
  });

  const dispatch = useDispatch();

  const handleUpdate = async () => {
    dispatch(updateTaskRealtime({ id: task.id, ...editData }));
    setIsEditing(false);
    await dispatch(updateTask({ id: task.id, ...editData }));
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteTask(task.id)).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCardClick = (e) => {
    if (!isEditing && e.target.closest('.task-actions') === null) {
      setShowModal(true);
    }
  };

  const taskLabels = task.taskLabels || [];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <>
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${isOverdue ? 'overdue' : ''}`}
          onClick={handleCardClick}
        >
          {taskLabels.length > 0 && (
            <div className="task-labels">
              {taskLabels.map((tl) => (
                <span
                  key={tl.labelId}
                  className="task-label"
                  style={{ backgroundColor: tl.label?.color || '#61bd4f' }}
                  title={tl.label?.name}
                />
              ))}
            </div>
          )}
          {isEditing ? (
            <div className="task-edit">
              <input
                type="text"
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                autoFocus
              />
              <textarea
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                rows="2"
              />
              <div className="task-edit-actions">
                <button onClick={handleUpdate} className="btn-save">
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="task-content">
                <h4>{task.title}</h4>
                {task.description && <p>{task.description}</p>}
              </div>
              <div className="task-badges">
                {task.priority && task.priority !== 'MEDIUM' && (
                  <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                    {task.priority === 'HIGH' ? '🔴' : '⚪'} {task.priority}
                  </span>
                )}
                {task.dueDate && (
                  <span className={`due-badge ${isOverdue ? 'overdue' : ''}`}>
                    🕐 {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                {task.assignee && (
                  <span className="assignee-badge" title={task.assignee.name}>
                    {task.assignee.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="task-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="task-action-btn"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="task-action-btn delete"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Draggable>
    {showModal && (
      <TaskDetailModal
        task={task}
        boardId={boardId}
        onClose={() => setShowModal(false)}
      />
    )}
    <ConfirmModal
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      onConfirm={handleDelete}
      title="Delete Task?"
      message={`Are you sure you want to delete "${task.title}"?`}
      confirmText="Delete"
      danger
    />
    </>
  );
}

export default TaskCard;
