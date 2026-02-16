import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { 
  fetchBoard, 
  clearCurrentBoard,
  deleteBoard,
  toggleStarBoard,
  addListRealtime, 
  updateListRealtime, 
  deleteListRealtime, 
  addTaskRealtime, 
  updateTaskRealtime, 
  moveTaskRealtime, 
  deleteTaskRealtime,
  memberAdded,
  boardUpdatedRealtime,
  boardDeletedRealtime
} from '../../store/slices/boardSlice';
import { moveTask } from '../../store/slices/taskSlice';
import { commentCreated, commentUpdated, commentDeleted } from '../../store/slices/commentsSlice';
import { fetchBoardLabels, labelCreated, labelUpdated, labelDeleted } from '../../store/slices/labelsSlice';
import socketService from '../../sockets/socket';
import BoardList from '../../components/BoardList/BoardList';
import CreateList from '../../components/CreateList/CreateList';
import InviteModal from '../../components/InviteModal';
import LabelManager from '../../components/LabelManager';
import Dropdown from '../../components/Dropdown/Dropdown';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Board.css';

function Board() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'dueToday', 'overdue'
  const { byId, currentBoardId, lists, tasks, loading } = useSelector((state) => state.board);
  const { user } = useSelector((state) => state.auth);
  const currentBoard = currentBoardId ? byId[currentBoardId] : null;

  useEffect(() => {
    if (!id) return;
    
    const loadBoard = async () => {
      try {
        await dispatch(fetchBoard(id)).unwrap();
        await dispatch(fetchBoardLabels(id));
      } catch (error) {
        if (error?.statusCode === 403) {
          navigate('/boards');
        }
      }
    };

    loadBoard();

    const socket = socketService.connect();
    socketService.joinBoard(id);

    socket.on('list:created', (list) => {
      dispatch(addListRealtime(list));
    });

    socket.on('list:updated', (list) => {
      dispatch(updateListRealtime(list));
    });

    socket.on('list:deleted', (data) => {
      dispatch(deleteListRealtime(data));
    });

    socket.on('list:moved', (data) => {
      dispatch(addListRealtime(data));
    });

    socket.on('task:created', (task) => {
      dispatch(addTaskRealtime(task));
    });

    socket.on('task:updated', (task) => {
      dispatch(updateTaskRealtime(task));
    });

    socket.on('task:moved', (data) => {
      dispatch(moveTaskRealtime(data));
    });

    socket.on('task:deleted', (data) => {
      dispatch(deleteTaskRealtime(data));
    });

    socket.on('comment:created', (comment) => {
      dispatch(commentCreated(comment));
    });

    socket.on('comment:updated', (comment) => {
      dispatch(commentUpdated(comment));
    });

    socket.on('comment:deleted', (data) => {
      dispatch(commentDeleted(data));
    });

    socket.on('label:created', (label) => {
      dispatch(labelCreated(label));
    });

    socket.on('label:updated', (label) => {
      dispatch(labelUpdated(label));
    });

    socket.on('label:deleted', (data) => {
      dispatch(labelDeleted(data));
    });

    socket.on('task:labelAdded', (data) => {
      dispatch(updateTaskRealtime({
        ...data,
        taskLabels: data.taskLabels || [{ labelId: data.labelId, label: data.label }]
      }));
    });

    socket.on('member-added', (member) => {
      dispatch(memberAdded(member));
    });

    socket.on('board-updated', (board) => {
      dispatch(boardUpdatedRealtime(board));
    });

    socket.on('board-deleted', (data) => {
      dispatch(boardDeletedRealtime(data));
      navigate('/boards');
    });

    return () => {
      socketService.leaveBoard(id);
      socket.off('list:created');
      socket.off('list:updated');
      socket.off('list:deleted');
      socket.off('list:moved');
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('comment:created');
      socket.off('comment:updated');
      socket.off('comment:deleted');
      socket.off('label:created');
      socket.off('label:updated');
      socket.off('label:deleted');
      socket.off('task:labelAdded');
      socket.off('member-added');
      socket.off('board-updated');
      socket.off('board-deleted');
      dispatch(clearCurrentBoard());
    };
  }, [id, dispatch, navigate]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (type === 'list') {
      const newListOrder = Array.from(lists.allIds);
      const [movedList] = newListOrder.splice(source.index, 1);
      newListOrder.splice(destination.index, 0, movedList);
      return;
    }

    if (type === 'task') {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;

      dispatch(moveTaskRealtime({
        taskId: draggableId,
        sourceListId,
        destinationListId: destListId,
        position: destination.index,
      }));

      await dispatch(
        moveTask({
          id: draggableId,
          sourceListId,
          listId: destListId,
          position: destination.index,
        })
      );
    }
  };

  const handleDeleteBoard = async () => {
    try {
      await dispatch(deleteBoard(id)).unwrap();
      navigate('/boards');
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const handleToggleStar = async () => {
    try {
      await dispatch(toggleStarBoard(id)).unwrap();
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  // Filter tasks based on selected filter
  const filterTasks = (taskList) => {
    if (taskFilter === 'all') return taskList;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return taskList.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (taskFilter === 'dueToday') {
        return dueDate >= today && dueDate < tomorrow;
      }
      if (taskFilter === 'overdue') {
        return dueDate < today;
      }
      return true;
    });
  };

  if (loading || !currentBoard) {
    return (
      <div className="board-page">
        <div className="loading">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="board-page">
      <div className="board-toolbar">
        <div className="board-toolbar-left">
          <h1>{currentBoard.title}</h1>
          <div className="board-toolbar-actions">
            <button 
              className={`toolbar-btn ${currentBoard.isStarred ? 'starred' : ''}`}
              onClick={handleToggleStar}
            >
              {currentBoard.isStarred ? '⭐' : '☆'} Star
            </button>
            <select 
              className="toolbar-filter" 
              value={taskFilter} 
              onChange={(e) => setTaskFilter(e.target.value)}
            >
              <option value="all">All Tasks</option>
              <option value="dueToday">📅 Due Today</option>
              <option value="overdue">🔴 Overdue</option>
            </select>
            <button className="toolbar-btn" onClick={() => setShowLabelManager(true)}>
              🏷️ Labels
            </button>
            <button className="toolbar-btn" onClick={() => navigate(`/boards/${id}/members`)}>
              👥 Members
            </button>
            <Dropdown trigger={<button className="toolbar-btn">⋮ Menu</button>}>
              {String(currentBoard.ownerId) === String(user?.id) && (
                <div className="dropdown-item danger" onClick={() => setShowDeleteModal(true)}>
                  🗑️ Delete Board
                </div>
              )}
              <div className="dropdown-item" onClick={() => navigate(`/boards/${id}/members`)}>
                👥 Manage Members
              </div>
            </Dropdown>
          </div>
        </div>
        <div className="board-toolbar-right">
          <div className="board-members">
            {currentBoard.members?.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="member-avatar"
                title={member.user?.name || 'Member'}
              >
                {member.user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            ))}
            {currentBoard.members?.length > 5 && (
              <div className="member-avatar more">+{currentBoard.members.length - 5}</div>
            )}
          </div>
          <button className="toolbar-btn share-btn" onClick={() => setShowInviteModal(true)}>
            👥 Share
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="list" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="board-content"
            >
              {lists.allIds.map((listId, index) => {
                const list = lists.byId[listId];
                const listTasks = list.tasks.map(taskId => tasks.byId[taskId]).filter(Boolean);
                const filteredTasks = filterTasks(listTasks);
                return (
                  <BoardList
                    key={listId}
                    list={list}
                    tasks={filteredTasks}
                    index={index}
                    boardId={currentBoard.id}
                  />
                );
              })}
              {provided.placeholder}
              <CreateList boardId={currentBoard.id} />
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showInviteModal && (
        <InviteModal
          boardId={currentBoard.id}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showLabelManager && (
        <LabelManager
          boardId={currentBoard.id}
          onClose={() => setShowLabelManager(false)}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteBoard}
        title="Delete Board?"
        message={`Are you sure you want to delete "${currentBoard.title}"? This action cannot be undone and will permanently delete all lists and tasks.`}
        confirmText="Delete Board"
        danger
      />
    </div>
  );
}

export default Board;
