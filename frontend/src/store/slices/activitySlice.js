import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as activityApi from '../../api/activity';

export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async ({ boardId, page = 1, limit = 20 }) => {
    const response = await activityApi.getActivities(boardId, page, limit);
    return response;
  }
);

export const fetchRecentActivities = createAsyncThunk(
  'activity/fetchRecentActivities',
  async ({ boardId, limit = 10 }) => {
    const response = await activityApi.getRecentActivities(boardId, limit);
    return response;
  }
);

export const fetchEntityActivities = createAsyncThunk(
  'activity/fetchEntityActivities',
  async ({ entity, entityId, page = 1, limit = 10 }) => {
    const response = await activityApi.getEntityActivities(entity, entityId, page, limit);
    return { ...response, entity, entityId };
  }
);

const initialState = {
  activities: [],
  recentActivities: [],
  entityActivities: {},
  pagination: null,
  loading: false,
  error: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    clearActivities: (state) => {
      state.activities = [];
      state.pagination = null;
    },
    addActivity: (state, action) => {
      state.activities.unshift(action.payload);
      state.recentActivities.unshift(action.payload);
      if (state.recentActivities.length > 10) {
        state.recentActivities.pop();
      }
    },
    clearEntityActivities: (state, action) => {
      const key = `${action.payload.entity}:${action.payload.entityId}`;
      delete state.entityActivities[key];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload.activities;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchRecentActivities.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.recentActivities = action.payload;
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchEntityActivities.fulfilled, (state, action) => {
        const key = `${action.payload.entity}:${action.payload.entityId}`;
        state.entityActivities[key] = {
          activities: action.payload.activities,
          pagination: action.payload.pagination,
        };
      });
  },
});

export const { clearActivities, addActivity, clearEntityActivities } = activitySlice.actions;
export default activitySlice.reducer;
