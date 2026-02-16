import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import TaskCard from '../TaskCard/TaskCard';
import CreateTask from '../CreateTask/CreateTask';
import Dropdown from '../Dropdown/Dropdown';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import { deleteList } from '../../store/slices/listSlice';
import './BoardList.css';

const LIST_COLORS = [
  { bg: '#4a90e2', border: '#3a7bc8' },
  { bg: '#f5bc51', border: '#daa43c' },
  { bg: '#70c289', border: '#5aab73' },
  { bg: '#9f8fef', border: '#8a7ad4' },
  { bg: '#ef8f94', border: '#d47a7f' },
  { bg: '#4fc3f7', border: '#3baee2' },
];

function BoardList({ list, tasks, index, boardId }) {
  const dispatch = useDispatch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const colorScheme = LIST_COLORS[index % LIST_COLORS.length];

  const handleDelete = async () => {
    try {
      await dispatch(deleteList(list.id)).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  return (
    <>
      <Draggable draggableId={list.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="board-list"
          >
            <div 
              className="list-color-bar" 
              style={{ backgroundColor: colorScheme.bg }}
            />
            <div className="list-header" {...provided.dragHandleProps}>
              <h3>{list.title}</h3>
              <Dropdown trigger={<button className="list-menu-btn">⋯</button>}>
                <div className="dropdown-item danger" onClick={() => setShowDeleteModal(true)}>
                  🗑️ Delete List
                </div>
              </Dropdown>
            </div>

            <Droppable droppableId={list.id} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`task-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                >
                  {tasks.map((task, index) => (
                    <TaskCard key={task.id} task={task} index={index} boardId={boardId} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <CreateTask listId={list.id} />
          </div>
        )}
      </Draggable>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete List?"
        message={`Are you sure you want to delete "${list.title}"? All tasks in this list will be permanently deleted.`}
        confirmText="Delete"
        danger
      />
    </>
  );
}

export default BoardList;
