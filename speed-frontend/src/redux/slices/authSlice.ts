import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';
import type { JwtResponse, LoginRequest, RegisterRequest } from '@/types';

interface AuthState {
  user: JwtResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const stored = localStorage.getItem('user');
const initialState: AuthState = {
  user: stored ? JSON.parse(stored) : null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
};

export const loginAsync = createAsyncThunk('auth/login', async (data: LoginRequest, { rejectWithValue }) => {
  try {
    const response = await authService.login(data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Đăng nhập thất bại');
  }
});

export const registerAsync = createAsyncThunk('auth/register', async (data: RegisterRequest, { rejectWithValue }) => {
  try {
    const response = await authService.register(data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Đăng ký thất bại');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<{ fullName?: string; phone?: string }>) => {
      if (!state.user) return;
      if (action.payload.fullName) state.user.fullName = action.payload.fullName;
      state.user = { ...state.user };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    const handleAuth = (state: AuthState, action: PayloadAction<JwtResponse>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('user', JSON.stringify(action.payload));
    };

    builder
      .addCase(loginAsync.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginAsync.fulfilled, handleAuth)
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload as string;
      })
      .addCase(registerAsync.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerAsync.fulfilled, handleAuth)
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
