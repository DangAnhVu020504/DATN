import api from './api';
import type { ApiResponse, VoucherResponse, VoucherRequest } from '@/types';

export const voucherService = {
  getActiveVouchers: () =>
    api.get<ApiResponse<VoucherResponse[]>>('/vouchers/active'),

getVoucherById: (id: number) =>
    api.get<ApiResponse<VoucherResponse>>(`/vouchers/${id}`),

  getAllVouchers: () =>
    api.get<ApiResponse<VoucherResponse[]>>('/vouchers'),

  toggleVoucher: (id: number) =>
    api.put<ApiResponse<VoucherResponse>>(`/vouchers/${id}/toggle`),

  validateVoucher: (code: string, orderValue: number) =>
    api.post<ApiResponse<VoucherResponse>>('/vouchers/validate', null, {
      params: { code, orderValue },
    }),

  createVoucher: (data: VoucherRequest) =>
    api.post<ApiResponse<VoucherResponse>>('/vouchers', data),
};
