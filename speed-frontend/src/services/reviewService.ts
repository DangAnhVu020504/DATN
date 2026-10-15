import api from './api';
import type { ApiResponse, ReviewResponse, Page } from '@/types';

export const reviewService = {
  createReview: (customerId: number, orderId: number, rating: number, comment?: string) =>
    api.post<ApiResponse<ReviewResponse>>('/reviews', null, {
      params: { customerId, orderId, rating, comment },
    }),

  getOrderReview: (orderId: number) =>
    api.get<ApiResponse<ReviewResponse>>(`/reviews/order/${orderId}`),

  getDriverReviews: (driverId: number, page = 0, size = 10) =>
    api.get<ApiResponse<Page<ReviewResponse>>>(`/reviews/driver/${driverId}`, {
      params: { page, size },
    }),
};
