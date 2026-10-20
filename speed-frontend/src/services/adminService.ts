import api from './api';
import type { ApiResponse, UserResponse, DashboardResponse, LogResponse, OrderResponse, Page } from '@/types';

export const adminService = {
  getDashboard: () =>
    api.get<ApiResponse<DashboardResponse>>('/admin/dashboard'),

  getOrders: (page = 0, size = 20, status?: string) =>
    api.get<ApiResponse<Page<OrderResponse>>>('/admin/orders', {
      params: { page, size, ...(status && status !== 'ALL' ? { status } : {}) },
    }),


  getUsers: (page = 0, size = 10) =>
    api.get<ApiResponse<Page<UserResponse>>>('/admin/users', { params: { page, size } }),

  getUserById: (id: number) =>
    api.get<ApiResponse<UserResponse>>(`/admin/users/${id}`),

  toggleUserActive: (id: number, active: boolean) =>
    api.put<ApiResponse<void>>(`/admin/users/${id}/toggle-active`, null, { params: { active } }),

  deleteUser: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/users/${id}`),

  getLogs: (page = 0, size = 20) =>
    api.get<ApiResponse<Page<LogResponse>>>('/admin/logs', { params: { page, size } }),

  getUserLogs: (userId: number, page = 0, size = 20) =>
    api.get<ApiResponse<Page<LogResponse>>>(`/admin/logs/user/${userId}`, { params: { page, size } }),
};
