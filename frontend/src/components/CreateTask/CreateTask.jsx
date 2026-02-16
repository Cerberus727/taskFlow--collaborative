import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTask } from '../../store/slices/taskSlice';
import { useAuth } from '../../context/AuthContext';
import './CreateTask.css';

function CreateTask({ listId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [taskData, setTaskData] = useState({ 
    title: '', 
    description: '',
    priority: 'MEDIUM',
    dueDate: ''
  });
  const { token } = useSelector((state) => state.auth);
  const { requireAuth } = useAuth();

  const dispatch = useDispatch();

  const handleAddClick = () => {
    requireAuth(() => setIsAdding(true));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskData.title.trim()) return;
    if (!token) {
      requireAuth(() => {});
      return;
    }

    try {
      await dispatch(createTask({ listId, ...taskData })).unwrap();
      setTaskData({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  if (!isAdding) {
    return (
      <button onClick={handleAddClick} className="add-task-btn">
        + Add task
      </button>
    );
  }

  return (
    <div className="create-task-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task title"
          value={taskData.title}
          onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
          autoFocus
        />
        <textarea
          placeholder="Description (optional)"
          value={taskData.description}
          onChange={(e) =>
            setTaskData({ ...taskData, description: e.target.value })
          }
          rows="2"
        />
        <div className="task-properties">
          <div className="property-field">
            <label>Priority</label>
            <select
              value={taskData.priority}
              onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
              className={`priority-select priority-${taskData.priority.toLowerCase()}`}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="property-field">
            <label>Due Date</label>
            <input
              type="date"
              value={taskData.dueDate}
              onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
              className="due-date-input"
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-add">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setTaskData({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
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

export default CreateTask;
