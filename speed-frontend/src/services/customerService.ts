import api from './api';
import type { ApiResponse, AddressResponse, AddressRequest } from '@/types';

export const customerService = {
  getAddresses: (customerId: number) =>
    api.get<ApiResponse<AddressResponse[]>>(`/customers/${customerId}/addresses`),

  addAddress: (customerId: number, data: AddressRequest) =>
    api.post<ApiResponse<AddressResponse>>(`/customers/${customerId}/addresses`, data),

  updateAddress: (customerId: number, addressId: number, data: AddressRequest) =>
    api.put<ApiResponse<AddressResponse>>(`/customers/${customerId}/addresses/${addressId}`, data),

  deleteAddress: (customerId: number, addressId: number) =>
    api.delete<ApiResponse<void>>(`/customers/${customerId}/addresses/${addressId}`),
};
