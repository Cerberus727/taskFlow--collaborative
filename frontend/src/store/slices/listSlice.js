import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as listApi from '../../api/list';

export const createList = createAsyncThunk(
  'list/createList',
  async ({ boardId, title }) => {
    const response = await listApi.createList({ boardId, title });
    return response;
  }
);

export const updateList = createAsyncThunk('list/updateList', async ({ id, ...data }) => {
  const response = await listApi.updateList(id, data);
  return response;
});

export const moveList = createAsyncThunk('list/moveList', async ({ id, position }) => {
  const response = await listApi.moveList(id, position);
  return response;
});

export const deleteList = createAsyncThunk('list/deleteList', async (listId) => {
  await listApi.deleteList(listId);
  return listId;
});

const initialState = {
  byId: {},
  allIds: [],
  loading: false,
  error: null,
};

const listSlice = createSlice({
  name: 'list',
  initialState,
  reducers: {
    addList: (state, action) => {
      const list = action.payload;
      if (list && list.id) {
        state.byId[list.id] = list;
        if (!state.allIds.includes(list.id)) {
          state.allIds.push(list.id);
        }
      }
    },
    removeList: (state, action) => {
      const listId = action.payload;
      delete state.byId[listId];
      state.allIds = state.allIds.filter((id) => id !== listId);
    },
    moveListRealtime: (state, action) => {
      // Handled in board state
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createList.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(createList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateList.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(moveList.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteList.fulfilled, (state, action) => {
        const listId = action.payload;
        delete state.byId[listId];
        state.allIds = state.allIds.filter((id) => id !== listId);
        state.loading = false;
      });
  },
});

export const { addList, removeList, moveListRealtime } = listSlice.actions;
export default listSlice.reducer;
