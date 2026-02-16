import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { labelApi } from '../../api/labels';

export const fetchBoardLabels = createAsyncThunk(
  'labels/fetchBoardLabels',
  async (boardId, { rejectWithValue }) => {
    try {
      const { data } = await labelApi.getByBoard(boardId);
      return { boardId, labels: data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch labels');
    }
  }
);

export const createLabel = createAsyncThunk(
  'labels/createLabel',
  async ({ boardId, name, color }, { rejectWithValue }) => {
    try {
      const { data } = await labelApi.create({ boardId, name, color });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create label');
    }
  }
);

export const updateLabel = createAsyncThunk(
  'labels/updateLabel',
  async ({ id, name, color }, { rejectWithValue }) => {
    try {
      const { data } = await labelApi.update(id, { name, color });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update label');
    }
  }
);

export const deleteLabel = createAsyncThunk(
  'labels/deleteLabel',
  async (id, { rejectWithValue }) => {
    try {
      await labelApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete label');
    }
  }
);

export const addLabelToTask = createAsyncThunk(
  'labels/addLabelToTask',
  async ({ taskId, labelId }, { rejectWithValue }) => {
    try {
      const { data } = await labelApi.addToTask(taskId, labelId);
      return { taskId, labelId, label: data.label };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add label');
    }
  }
);

export const removeLabelFromTask = createAsyncThunk(
  'labels/removeLabelFromTask',
  async ({ taskId, labelId }, { rejectWithValue }) => {
    try {
      await labelApi.removeFromTask(taskId, labelId);
      return { taskId, labelId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove label');
    }
  }
);

const initialState = {
  byBoardId: {},
  loading: false,
  error: null,
};

const labelsSlice = createSlice({
  name: 'labels',
  initialState,
  reducers: {
    labelCreated: (state, action) => {
      const label = action.payload;
      const boardId = label.boardId;
      if (!state.byBoardId[boardId]) {
        state.byBoardId[boardId] = { byId: {}, allIds: [] };
      }
      if (!state.byBoardId[boardId].byId[label.id]) {
        state.byBoardId[boardId].byId[label.id] = label;
        state.byBoardId[boardId].allIds.push(label.id);
      }
    },
    labelUpdated: (state, action) => {
      const label = action.payload;
      const boardId = label.boardId;
      if (state.byBoardId[boardId]?.byId[label.id]) {
        state.byBoardId[boardId].byId[label.id] = label;
      }
    },
    labelDeleted: (state, action) => {
      const { id, boardId } = action.payload;
      if (state.byBoardId[boardId]) {
        delete state.byBoardId[boardId].byId[id];
        state.byBoardId[boardId].allIds = state.byBoardId[boardId].allIds.filter(
          (lid) => lid !== id
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardLabels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoardLabels.fulfilled, (state, action) => {
        state.loading = false;
        const { boardId, labels } = action.payload;
        state.byBoardId[boardId] = { byId: {}, allIds: [] };
        labels.forEach((label) => {
          state.byBoardId[boardId].byId[label.id] = label;
          state.byBoardId[boardId].allIds.push(label.id);
        });
      })
      .addCase(fetchBoardLabels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createLabel.fulfilled, (state, action) => {
        const label = action.payload;
        const boardId = label.boardId;
        if (!state.byBoardId[boardId]) {
          state.byBoardId[boardId] = { byId: {}, allIds: [] };
        }
        state.byBoardId[boardId].byId[label.id] = label;
        state.byBoardId[boardId].allIds.push(label.id);
      })
      .addCase(updateLabel.fulfilled, (state, action) => {
        const label = action.payload;
        const boardId = label.boardId;
        if (state.byBoardId[boardId]) {
          state.byBoardId[boardId].byId[label.id] = label;
        }
      })
      .addCase(deleteLabel.fulfilled, (state, action) => {
        const labelId = action.payload;
        Object.keys(state.byBoardId).forEach((boardId) => {
          if (state.byBoardId[boardId].byId[labelId]) {
            delete state.byBoardId[boardId].byId[labelId];
            state.byBoardId[boardId].allIds = state.byBoardId[boardId].allIds.filter(
              (id) => id !== labelId
            );
          }
        });
      });
  },
});

export const { labelCreated, labelUpdated, labelDeleted } = labelsSlice.actions;

export const selectBoardLabels = (state, boardId) => {
  const boardLabels = state.labels.byBoardId[boardId];
  if (!boardLabels) return [];
  return boardLabels.allIds.map((id) => boardLabels.byId[id]);
};

export const selectLabelsLoading = (state) => state.labels.loading;

export default labelsSlice.reducer;
