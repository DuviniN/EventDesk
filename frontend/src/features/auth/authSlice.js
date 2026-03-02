import { createSlice } from '@reduxjs/toolkit';

// Parse stored user — if the object is stale (missing role), wipe it so
// ProtectedRoute never sees an authenticated-but-roleless state.
const storedToken = localStorage.getItem('accessToken');
let storedUser = null;
try {
  const raw = localStorage.getItem('user');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.role) {
      storedUser = parsed;
    } else {
      // Stale data — clear it so the user is forced to log in fresh
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    }
  }
} catch {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
}

const initialState = {
  user: storedUser || null,
  token: storedUser ? storedToken : null,
  isAuthenticated: !!(storedUser && storedToken),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      // Ensure role always has a value — Mongoose default is 'attendee'
      const user = action.payload.user
        ? { ...action.payload.user, role: action.payload.user.role || 'attendee' }
        : null;
      state.user = user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAccessToken = (state) => state.auth.token;

export default authSlice.reducer;