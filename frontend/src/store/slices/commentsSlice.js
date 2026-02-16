import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { commentApi } from '../../api/comments';

export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async ({ taskId, page = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await commentApi.getByTask(taskId, page);
      return { taskId, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ taskId, content }, { rejectWithValue }) => {
    try {
      const { data } = await commentApi.create({ taskId, content });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const { data } = await commentApi.update(id, content);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (id, { rejectWithValue }) => {
    try {
      await commentApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

const initialState = {
  byTaskId: {},
  loading: false,
  error: null,
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    commentCreated: (state, action) => {
      const comment = action.payload;
      const taskId = comment.taskId;
      if (!state.byTaskId[taskId]) {
        state.byTaskId[taskId] = { byId: {}, allIds: [], hasMore: false, page: 1 };
      }
      if (!state.byTaskId[taskId].byId[comment.id]) {
        state.byTaskId[taskId].byId[comment.id] = comment;
        state.byTaskId[taskId].allIds.unshift(comment.id);
      }
    },
    commentUpdated: (state, action) => {
      const comment = action.payload;
      const taskId = comment.taskId;
      if (state.byTaskId[taskId]?.byId[comment.id]) {
        state.byTaskId[taskId].byId[comment.id] = comment;
      }
    },
    commentDeleted: (state, action) => {
      const { id, taskId } = action.payload;
      if (state.byTaskId[taskId]) {
        delete state.byTaskId[taskId].byId[id];
        state.byTaskId[taskId].allIds = state.byTaskId[taskId].allIds.filter((cid) => cid !== id);
      }
    },
    clearTaskComments: (state, action) => {
      delete state.byTaskId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        const { taskId, comments, total, page, limit } = action.payload;
        if (!state.byTaskId[taskId]) {
          state.byTaskId[taskId] = { byId: {}, allIds: [], hasMore: false, page: 1 };
        }
        comments.forEach((comment) => {
          state.byTaskId[taskId].byId[comment.id] = comment;
          if (!state.byTaskId[taskId].allIds.includes(comment.id)) {
            state.byTaskId[taskId].allIds.push(comment.id);
          }
        });
        state.byTaskId[taskId].hasMore = page * limit < total;
        state.byTaskId[taskId].page = page;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const comment = action.payload;
        const taskId = comment.taskId;
        if (!state.byTaskId[taskId]) {
          state.byTaskId[taskId] = { byId: {}, allIds: [], hasMore: false, page: 1 };
        }
        state.byTaskId[taskId].byId[comment.id] = comment;
        state.byTaskId[taskId].allIds.unshift(comment.id);
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const comment = action.payload;
        const taskId = comment.taskId;
        if (state.byTaskId[taskId]) {
          state.byTaskId[taskId].byId[comment.id] = comment;
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const commentId = action.payload;
        Object.keys(state.byTaskId).forEach((taskId) => {
          if (state.byTaskId[taskId].byId[commentId]) {
            delete state.byTaskId[taskId].byId[commentId];
            state.byTaskId[taskId].allIds = state.byTaskId[taskId].allIds.filter(
              (id) => id !== commentId
            );
          }
        });
      });
  },
});

export const { commentCreated, commentUpdated, commentDeleted, clearTaskComments } =
  commentsSlice.actions;

export const selectTaskComments = (state, taskId) => {
  const taskComments = state.comments.byTaskId[taskId];
  if (!taskComments) return [];
  return taskComments.allIds.map((id) => taskComments.byId[id]);
};

export const selectCommentsLoading = (state) => state.comments.loading;

export default commentsSlice.reducer;
