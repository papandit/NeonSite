// Admin auth slice. Same shape as the customer app, but ADMIN-ONLY: a login
// that returns a non-admin user is rejected and never persisted.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, apiErrorMessage, TOKEN_KEY, USER_KEY } from '../services/api';
import { toast } from '../lib/toast';

function loadInitialState() {
  let user = null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }
  return {
    token: localStorage.getItem(TOKEN_KEY) || null,
    user,
    status: 'idle',
    error: null,
  };
}

function persist(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearPersisted() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      // Enforce admin-only access at the door.
      if (data.data.user?.role !== 'admin') {
        toast.error('This account does not have admin access.');
        return rejectWithValue('This account does not have admin access.');
      }
      toast.success('Signed in');
      return data.data; // { token, user }
    } catch (error) {
      const msg = apiErrorMessage(error, 'Login failed');
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const loadProfile = createAsyncThunk(
  'auth/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/profile');
      if (data.data.user?.role !== 'admin') {
        return rejectWithValue('Not an admin account.');
      }
      return data.data.user;
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error, 'Session expired'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      clearPersisted();
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.token = action.payload.token;
        state.user = action.payload.user;
        persist(action.payload.token, action.payload.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      })
      .addCase(loadProfile.rejected, (state) => {
        state.token = null;
        state.user = null;
        clearPersisted();
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectUser = (state) => state.auth.user;

export default authSlice.reducer;
