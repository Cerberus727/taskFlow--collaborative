import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';
import * as boardApi from '../../api/board';

export const fetchInvitations = createAsyncThunk(
  'invitations/fetchInvitations',
  async () => {
    const response = await api.get('/invitations');
    return response;
  }
);

export const acceptInvitation = createAsyncThunk(
  'invitations/acceptInvitation',
  async (invitationId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/accept`);
      const boardId = response.member.boardId;
      const board = await boardApi.getBoard(boardId);
      return { invitationId, board };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const rejectInvitation = createAsyncThunk(
  'invitations/rejectInvitation',
  async (invitationId) => {
    const response = await api.post(`/invitations/${invitationId}/reject`);
    return response;
  }
);

export const fetchPendingInvitations = createAsyncThunk(
  'invitations/fetchPendingInvitations',
  async (boardId) => {
    const response = await api.get(`/invitations/board/${boardId}`);
    return { boardId, invitations: response };
  }
);

const initialState = {
  items: [],
  byBoardId: {},
  loading: false,
  error: null,
};

const invitationSlice = createSlice({
  name: 'invitations',
  initialState,
  reducers: {
    invitationReceived: (state, action) => {
      const invitation = action.payload;
      const exists = state.items.some(inv => inv.id === invitation.id);
      if (!exists) {
        state.items.push(invitation);
      }
    },
    clearInvitations: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvitations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(acceptInvitation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(inv => inv.id !== action.payload.invitationId);
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(rejectInvitation.fulfilled, (state, action) => {
        state.items = state.items.filter(inv => inv.id !== action.meta.arg);
      })
      .addCase(fetchPendingInvitations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingInvitations.fulfilled, (state, action) => {
        state.loading = false;
        const { boardId, invitations } = action.payload;
        state.byBoardId[boardId] = invitations;
      })
      .addCase(fetchPendingInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { invitationReceived, clearInvitations } = invitationSlice.actions;
export default invitationSlice.reducer;
