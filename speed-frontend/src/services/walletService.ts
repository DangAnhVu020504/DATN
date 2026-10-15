import api from './api';
import type { ApiResponse, WalletResponse, TransactionResponse, Page } from '@/types';

export const walletService = {
  getWallet: (driverId: number) =>
    api.get<ApiResponse<WalletResponse>>(`/wallets/driver/${driverId}`),

  getTransactions: (driverId: number, page = 0, size = 10) =>
    api.get<ApiResponse<Page<TransactionResponse>>>(`/wallets/driver/${driverId}/transactions`, {
      params: { page, size },
    }),

  withdraw: (driverId: number, amount: number) =>
    api.post<ApiResponse<WalletResponse>>(`/wallets/driver/${driverId}/withdraw`, null, {
      params: { amount },
    }),
};
