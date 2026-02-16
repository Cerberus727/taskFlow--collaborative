import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

export const fetchBoardMembers = createAsyncThunk(
  'members/fetchBoardMembers',
  async (boardId) => {
    const response = await api.get(`/boards/${boardId}`);
    return response.members || [];
  }
);

export const updateMemberRole = createAsyncThunk(
  'members/updateMemberRole',
  async ({ boardId, memberId, role }) => {
    const response = await api.patch(`/boards/${boardId}/members/${memberId}`, { role });
    return response;
  }
);

export const removeMember = createAsyncThunk(
  'members/removeMember',
  async ({ boardId, memberId }) => {
    await api.delete(`/boards/${boardId}/members/${memberId}`);
    return memberId;
  }
);

const initialState = {
  byBoardId: {},
  loading: false,
  error: null,
};

const memberSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    memberAdded: (state, action) => {
      const member = action.payload;
      if (member.boardId) {
        if (!state.byBoardId[member.boardId]) {
          state.byBoardId[member.boardId] = [];
        }
        const exists = state.byBoardId[member.boardId].some(m => m.id === member.id);
        if (!exists) {
          state.byBoardId[member.boardId].push(member);
        }
      }
    },
    memberRemoved: (state, action) => {
      const { boardId, memberId } = action.payload;
      if (state.byBoardId[boardId]) {
        state.byBoardId[boardId] = state.byBoardId[boardId].filter(m => m.id !== memberId);
      }
    },
    clearMembers: (state) => {
      state.byBoardId = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardMembers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBoardMembers.fulfilled, (state, action) => {
        state.loading = false;
        const boardId = action.meta.arg;
        state.byBoardId[boardId] = action.payload;
      })
      .addCase(fetchBoardMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const updatedMember = action.payload;
        const boardId = action.meta.arg.boardId;
        if (state.byBoardId[boardId]) {
          const index = state.byBoardId[boardId].findIndex(m => m.id === updatedMember.id);
          if (index !== -1) {
            state.byBoardId[boardId][index] = updatedMember;
          }
        }
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        const { boardId } = action.meta.arg;
        const memberId = action.payload;
        if (state.byBoardId[boardId]) {
          state.byBoardId[boardId] = state.byBoardId[boardId].filter(m => m.id !== memberId);
        }
      });
  },
});

export const { memberAdded, memberRemoved, clearMembers } = memberSlice.actions;
export default memberSlice.reducer;
