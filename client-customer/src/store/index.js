import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';
import { setUnauthorizedHandler } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Wire the axios 401 handler to dispatch logout (breaks the import cycle:
// api never imports the store).
setUnauthorizedHandler(() => {
  store.dispatch(logout());
});
