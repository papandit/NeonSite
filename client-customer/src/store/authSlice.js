// Auth slice: token + user, login/register/loadProfile thunks, logout.
// Token + safe user are persisted to localStorage (real Vite app).

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
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
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
      const first = data.data.user?.name?.split(' ')[0];
      toast.success(first ? `Welcome back, ${first}!` : 'Signed in');
      return data.data; // { token, user }
    } catch (error) {
      const msg = apiErrorMessage(error, 'Login failed');
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', payload);
      toast.success('Account created — welcome to NameCraft!');
      return data.data; // { token, user }
    } catch (error) {
      const msg = apiErrorMessage(error, 'Registration failed');
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
    const onAuthed = (state, action) => {
      state.status = 'succeeded';
      state.error = null;
      state.token = action.payload.token;
      state.user = action.payload.user;
      persist(action.payload.token, action.payload.user);
    };
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, onAuthed)
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, onAuthed)
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Registration failed';
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      })
      .addCase(loadProfile.rejected, (state) => {
        // Token invalid/expired — drop it.
        state.token = null;
        state.user = null;
        clearPersisted();
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectUser = (state) => state.auth.user;

export default authSlice.reducer;
