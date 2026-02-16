import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import boardReducer from './slices/boardSlice';
import listReducer from './slices/listSlice';
import taskReducer from './slices/taskSlice';
import activityReducer from './slices/activitySlice';
import commentsReducer from './slices/commentsSlice';
import labelsReducer from './slices/labelsSlice';
import invitationReducer from './slices/invitationSlice';
import memberReducer from './slices/memberSlice';

const appReducer = combineReducers({
  auth: authReducer,
  board: boardReducer,
  list: listReducer,
  task: taskReducer,
  activity: activityReducer,
  comments: commentsReducer,
  labels: labelsReducer,
  invitations: invitationReducer,
  members: memberReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});
