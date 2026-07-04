import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';
import { setUnauthorizedHandler } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

setUnauthorizedHandler(() => {
  store.dispatch(logout());
});
