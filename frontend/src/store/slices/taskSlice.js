import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as taskApi from '../../api/task';

export const createTask = createAsyncThunk('task/createTask', async (taskData) => {
  const response = await taskApi.createTask(taskData);
  return response;
});

export const updateTask = createAsyncThunk('task/updateTask', async ({ id, ...data }) => {
  const response = await taskApi.updateTask(id, data);
  return response;
});

export const moveTask = createAsyncThunk('task/moveTask', async ({ id, sourceListId, listId, position }) => {
  const response = await taskApi.moveTask(id, { sourceListId, listId, position });
  return response;
});

export const assignTask = createAsyncThunk('task/assignTask', async ({ taskId, assigneeId }) => {
  const response = await taskApi.assignTask(taskId, assigneeId);
  return response;
});

export const searchTasks = createAsyncThunk('task/searchTasks', async (params) => {
  const response = await taskApi.searchTasks(params);
  return response;
});

export const deleteTask = createAsyncThunk('task/deleteTask', async (taskId) => {
  await taskApi.deleteTask(taskId);
  return taskId;
});

const initialState = {
  loading: false,
  searchLoading: false,
  error: null,
  searchResults: [],
  searchPagination: null,
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    addTaskRealtime: (state, action) => {
      // Handled in board state
    },
    updateTaskRealtime: (state, action) => {
      // Handled in board state
    },
    removeTaskRealtime: (state, action) => {
      // Handled in board state
    },
    moveTaskRealtime: (state, action) => {
      // Handled in board state
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchPagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTask.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateTask.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(moveTask.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(assignTask.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(searchTasks.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchTasks.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.tasks;
        state.searchPagination = action.payload.pagination;
      })
      .addCase(searchTasks.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.error.message;
      })
      .addCase(deleteTask.fulfilled, (state) => {
        state.loading = false;
      });
  },
});

export const { addTaskRealtime, updateTaskRealtime, removeTaskRealtime, moveTaskRealtime, clearSearchResults } = taskSlice.actions;
export default taskSlice.reducer;
