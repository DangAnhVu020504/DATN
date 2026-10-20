import api from './api';
import type { ApiResponse, OrderResponse, OrderHistoryResponse, Page, CreateOrderRequest } from '@/types';

export const orderService = {
  createOrder: (data: CreateOrderRequest) =>
    api.post<ApiResponse<OrderResponse>>('/orders', data),

  getOrderById: (id: number) =>
    api.get<ApiResponse<OrderResponse>>(`/orders/${id}`),

  getOrderHistory: (id: number) =>
    api.get<ApiResponse<OrderHistoryResponse[]>>(`/orders/${id}/history`),

  getOrderByCode: (code: string) =>
    api.get<ApiResponse<OrderResponse>>(`/orders/code/${code}`),

  getCustomerOrders: (customerId: number, page = 0, size = 10, sort = 'createdAt,desc') =>
    api.get<ApiResponse<Page<OrderResponse>>>(`/orders/customer/${customerId}`, {
      params: { page, size, sort },
    }),

  updateStatus: (id: number, status: string) =>
    api.put<ApiResponse<OrderResponse>>(`/orders/${id}/status`, null, { params: { status } }),

  cancelOrder: (id: number, reason: string) =>
    api.put<ApiResponse<OrderResponse>>(`/orders/${id}/cancel`, null, { params: { reason } }),
};
