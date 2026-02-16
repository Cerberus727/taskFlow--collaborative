import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as boardApi from '../../api/board';
import { createList, deleteList } from './listSlice';
import { createTask, deleteTask } from './taskSlice';

export const fetchBoards = createAsyncThunk('board/fetchBoards', async () => {
  const response = await boardApi.getBoards();
  return response;
});

export const fetchBoard = createAsyncThunk('board/fetchBoard', async (boardId) => {
  const response = await boardApi.getBoard(boardId);
  return response;
});

export const createBoard = createAsyncThunk('board/createBoard', async (boardData) => {
  const response = await boardApi.createBoard(boardData);
  return response;
});

export const updateBoard = createAsyncThunk('board/updateBoard', async ({ id, ...data }) => {
  const response = await boardApi.updateBoard(id, data);
  return response;
});

export const deleteBoard = createAsyncThunk('board/deleteBoard', async (boardId) => {
  await boardApi.deleteBoard(boardId);
  return boardId;
});

export const toggleStarBoard = createAsyncThunk('board/toggleStarBoard', async (boardId) => {
  const response = await boardApi.toggleStarBoard(boardId);
  return response;
});

export const addMember = createAsyncThunk(
  'board/addMember',
  async ({ boardId, email, role }, { rejectWithValue }) => {
    try {
      const response = await boardApi.addMember(boardId, { email, role });
      return { boardId, member: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
  }
);

const initialState = {
  byId: {},
  allIds: [],
  currentBoardId: null,
  lists: {
    byId: {},
    allIds: [],
  },
  tasks: {
    byId: {},
    allIds: [],
  },
  loading: false,
  error: null,
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    clearCurrentBoard: (state) => {
      state.currentBoardId = null;
    },
    boardAccepted: (state, action) => {
      const board = action.payload;
      state.byId[board.id] = board;
      if (!state.allIds.includes(board.id)) {
        state.allIds.unshift(board.id);
      }
    },
    addListRealtime: (state, action) => {
      const list = action.payload;
      if (list && list.id) {
        state.lists.byId[list.id] = { ...list, tasks: list.tasks || [] };
        if (!state.lists.allIds.includes(list.id)) {
          state.lists.allIds.push(list.id);
        }
      }
    },
    updateListRealtime: (state, action) => {
      const list = action.payload;
      if (state.lists.byId[list.id]) {
        state.lists.byId[list.id] = { ...state.lists.byId[list.id], ...list };
      }
    },
    deleteListRealtime: (state, action) => {
      const listId = action.payload.listId;
      delete state.lists.byId[listId];
      state.lists.allIds = state.lists.allIds.filter(id => id !== listId);
      Object.values(state.tasks.byId).forEach(task => {
        if (task.listId === listId) {
          delete state.tasks.byId[task.id];
          state.tasks.allIds = state.tasks.allIds.filter(id => id !== task.id);
        }
      });
    },
    addTaskRealtime: (state, action) => {
      const task = action.payload;
      if (task && task.id) {
        state.tasks.byId[task.id] = task;
        if (!state.tasks.allIds.includes(task.id)) {
          state.tasks.allIds.push(task.id);
        }
        if (state.lists.byId[task.listId]) {
          if (!state.lists.byId[task.listId].tasks) {
            state.lists.byId[task.listId].tasks = [];
          }
          if (!state.lists.byId[task.listId].tasks.includes(task.id)) {
            state.lists.byId[task.listId].tasks.push(task.id);
          }
        }
      }
    },
    updateTaskRealtime: (state, action) => {
      const task = action.payload;
      if (state.tasks.byId[task.id]) {
        state.tasks.byId[task.id] = { ...state.tasks.byId[task.id], ...task };
      }
    },
    moveTaskRealtime: (state, action) => {
      const { taskId, sourceListId, destinationListId, position } = action.payload;
      if (state.lists.byId[sourceListId]) {
        state.lists.byId[sourceListId].tasks = state.lists.byId[sourceListId].tasks.filter(id => id !== taskId);
      }
      if (state.lists.byId[destinationListId]) {
        const tasks = [...state.lists.byId[destinationListId].tasks];
        tasks.splice(position, 0, taskId);
        state.lists.byId[destinationListId].tasks = tasks;
      }
      if (state.tasks.byId[taskId]) {
        state.tasks.byId[taskId].listId = destinationListId;
        state.tasks.byId[taskId].position = position;
      }
    },
    deleteTaskRealtime: (state, action) => {
      const taskId = action.payload.taskId;
      const task = state.tasks.byId[taskId];
      if (task && state.lists.byId[task.listId]) {
        state.lists.byId[task.listId].tasks = state.lists.byId[task.listId].tasks.filter(id => id !== taskId);
      }
      delete state.tasks.byId[taskId];
      state.tasks.allIds = state.tasks.allIds.filter(id => id !== taskId);
    },
    memberAdded: (state, action) => {
      const member = action.payload;
      const boardId = state.currentBoardId;
      if (boardId && state.byId[boardId]) {
        if (!state.byId[boardId].members) {
          state.byId[boardId].members = [];
        }
        const exists = state.byId[boardId].members.some(m => m.userId === member.userId);
        if (!exists) {
          state.byId[boardId].members.push(member);
        }
      }
    },
    boardUpdatedRealtime: (state, action) => {
      const board = action.payload;
      if (state.byId[board.id]) {
        state.byId[board.id] = { ...state.byId[board.id], ...board };
      }
    },
    boardDeletedRealtime: (state, action) => {
      const { boardId } = action.payload;
      delete state.byId[boardId];
      state.allIds = state.allIds.filter(id => id !== boardId);
      if (state.currentBoardId === boardId) {
        state.currentBoardId = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach(board => {
          state.byId[board.id] = board;
          if (!state.allIds.includes(board.id)) {
            state.allIds.push(board.id);
          }
        });
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchBoard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.loading = false;
        const board = action.payload;
        state.byId[board.id] = board;
        state.currentBoardId = board.id;
        if (!state.allIds.includes(board.id)) {
          state.allIds.push(board.id);
        }
        state.lists.byId = {};
        state.lists.allIds = [];
        state.tasks.byId = {};
        state.tasks.allIds = [];
        board.lists?.forEach(list => {
          const taskIds = list.tasks?.map(t => t.id) || [];
          state.lists.byId[list.id] = { ...list, tasks: taskIds };
          state.lists.allIds.push(list.id);
          list.tasks?.forEach(task => {
            state.tasks.byId[task.id] = task;
            state.tasks.allIds.push(task.id);
          });
        });
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        const board = action.payload;
        state.byId[board.id] = board;
        state.allIds.unshift(board.id);
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        const board = action.payload;
        if (state.byId[board.id]) {
          state.byId[board.id] = { ...state.byId[board.id], ...board };
        }
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        delete state.byId[action.payload];
        state.allIds = state.allIds.filter(id => id !== action.payload);
        if (state.currentBoardId === action.payload) {
          state.currentBoardId = null;
        }
      })
      .addCase(toggleStarBoard.fulfilled, (state, action) => {
        const board = action.payload;
        if (state.byId[board.id]) {
          state.byId[board.id] = { ...state.byId[board.id], ...board };
        }
      })
      .addCase(addMember.fulfilled, (state, action) => {
        const { boardId, member } = action.payload;
        if (state.byId[boardId] && member) {
          if (!state.byId[boardId].members) {
            state.byId[boardId].members = [];
          }
          const exists = state.byId[boardId].members.some(m => m.userId === member.userId);
          if (!exists) {
            state.byId[boardId].members.push(member);
          }
        }
      })
      .addCase(createList.fulfilled, (state, action) => {
        const list = action.payload;
        if (list && list.id) {
          state.lists.byId[list.id] = { ...list, tasks: list.tasks || [] };
          if (!state.lists.allIds.includes(list.id)) {
            state.lists.allIds.push(list.id);
          }
        }
      })
      .addCase(deleteList.fulfilled, (state, action) => {
        const listId = action.payload;
        delete state.lists.byId[listId];
        state.lists.allIds = state.lists.allIds.filter(id => id !== listId);
        Object.values(state.tasks.byId).forEach(task => {
          if (task.listId === listId) {
            delete state.tasks.byId[task.id];
            state.tasks.allIds = state.tasks.allIds.filter(id => id !== task.id);
          }
        });
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const taskId = action.payload;
        const task = state.tasks.byId[taskId];
        if (task && state.lists.byId[task.listId]) {
          state.lists.byId[task.listId].tasks = state.lists.byId[task.listId].tasks.filter(id => id !== taskId);
        }
        delete state.tasks.byId[taskId];
        state.tasks.allIds = state.tasks.allIds.filter(id => id !== taskId);
      })
      .addCase(createTask.fulfilled, (state, action) => {
        const task = action.payload;
        if (task && task.id) {
          state.tasks.byId[task.id] = task;
          if (!state.tasks.allIds.includes(task.id)) {
            state.tasks.allIds.push(task.id);
          }
          if (state.lists.byId[task.listId]) {
            if (!state.lists.byId[task.listId].tasks) {
              state.lists.byId[task.listId].tasks = [];
            }
            if (!state.lists.byId[task.listId].tasks.includes(task.id)) {
              state.lists.byId[task.listId].tasks.push(task.id);
            }
          }
        }
      });
  },
});

export const { clearCurrentBoard, boardAccepted, addListRealtime, updateListRealtime, deleteListRealtime, addTaskRealtime, updateTaskRealtime, moveTaskRealtime, deleteTaskRealtime, memberAdded, boardUpdatedRealtime, boardDeletedRealtime } = boardSlice.actions;
export default boardSlice.reducer;
