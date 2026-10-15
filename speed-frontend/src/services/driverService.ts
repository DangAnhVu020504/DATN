import api from './api';
import type { ApiResponse, OrderResponse, Page } from '@/types';

export const driverService = {
  toggleAvailability: (driverId: number, available: boolean) =>
    api.put<ApiResponse<void>>(`/drivers/${driverId}/availability`, null, { params: { available } }),

  acceptOrder: (driverId: number, orderId: number) =>
    api.post<ApiResponse<OrderResponse>>(`/drivers/${driverId}/orders/${orderId}/accept`),

  rejectOrder: (driverId: number, orderId: number) =>
    api.post<ApiResponse<void>>(`/drivers/${driverId}/orders/${orderId}/reject`),

  completeDelivery: (driverId: number, orderId: number) =>
    api.put<ApiResponse<OrderResponse>>(`/drivers/${driverId}/orders/${orderId}/complete`),

  getDeliveryHistory: (driverId: number, page = 0, size = 10, sort = 'createdAt,desc') =>
    api.get<ApiResponse<Page<OrderResponse>>>(`/drivers/${driverId}/orders`, {
      params: { page, size, sort },
    }),

  getEarnings: (driverId: number) =>
    api.get<ApiResponse<number>>(`/drivers/${driverId}/earnings`),
};
