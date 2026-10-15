import api from './api';
import type { LoginRequest, RegisterRequest, ApiResponse, JwtResponse, UserResponse, UpdateProfileRequest } from '@/types';

export const authService = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<JwtResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<ApiResponse<JwtResponse>>('/auth/register', data),

  getProfile: () =>
    api.get<ApiResponse<UserResponse>>('/auth/profile'),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post(`/auth/forgot-password?email=${email}`),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', null, { params: { email, otp, newPassword } }),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<ApiResponse<UserResponse>>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};
