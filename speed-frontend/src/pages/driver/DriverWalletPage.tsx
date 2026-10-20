import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { walletService } from '@/services/walletService';
import type { TransactionResponse, WalletResponse } from '@/types';

export default function DriverWalletPage() {
  const driverId = useSelector((s: RootState) => s.auth.user?.driverId);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!driverId) return;
    setLoading(true);
    Promise.all([
      walletService.getWallet(driverId),
      walletService.getTransactions(driverId, 0, 50),
    ])
      .then(([walletRes, txRes]) => {
        setWallet(walletRes.data.data);
        setTransactions(txRes.data.data?.content ?? []);
      })
      .catch(() => setError('Không thể tải dữ liệu ví'))
      .finally(() => setLoading(false));
  }, [driverId]);

  useEffect(() => { load(); }, [load]);

  const handleWithdraw = async () => {
    if (!driverId) return;
    setWithdrawing(true);
    setError('');
    setMessage('');
    try {
      const res = await walletService.withdraw(driverId, Number(amount));
      setWallet(res.data.data);
      setAmount('');
      setMessage('Đã gửi yêu cầu rút tiền thành công!');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Rút tiền thất bại');
    } finally {
      setWithdrawing(false);
    }
  };

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sumSince = (from: Date) =>
    transactions
      .filter((t) => t.type === 'CREDIT' && new Date(t.createdAt) >= from)
      .reduce((s, t) => s + t.amount, 0);
  const weekEarning = sumSince(weekStart);
  const monthEarning = sumSince(monthStart);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Ví tài xế</h1>
        <p className="text-gray-500 text-sm mt-0.5">Quản lý thu nhập của bạn</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">⚠️ {error}</div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-medium">✅ {message}</div>
      )}

      {/* Balance card */}
      <div className="bg-red-gradient rounded-3xl p-7 mb-6 relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-2">Số dư khả dụng</p>
          <p className="text-white text-4xl font-black mb-4" style={{ fontFamily: 'Nunito' }}>
            {loading ? '...' : (wallet?.balance ?? 0).toLocaleString('vi-VN')}₫
          </p>
          <div className="flex gap-4">
            <div>
              <p className="text-white/60 text-xs">Tuần này</p>
              <p className="text-white font-bold text-sm">+{weekEarning.toLocaleString('vi-VN')}₫</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-white/60 text-xs">Tháng này</p>
              <p className="text-white font-bold text-sm">+{monthEarning.toLocaleString('vi-VN')}₫</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-white/60 text-xs">Giao dịch</p>
              <p className="text-white font-bold text-sm">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h3 className="font-bold text-gray-900 mb-4">💸 Rút tiền</h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₫</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nhập số tiền..."
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={!amount || withdrawing || Number(amount) <= 0 || Number(amount) > (wallet?.balance ?? 0)}
            className="px-5 py-3 bg-red-gradient text-white font-bold rounded-xl text-sm shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {withdrawing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
            Rút tiền
          </button>
        </div>
        {amount && Number(amount) > (wallet?.balance ?? 0) && (
          <p className="text-xs text-red-500 mt-2">Số tiền vượt quá số dư khả dụng</p>
        )}
        <div className="flex gap-2 mt-3">
          {['50000', '100000', '200000', '500000'].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="flex-1 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-600 transition-all duration-200"
            >
              {(Number(v) / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Lịch sử giao dịch</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {loading && (
            <div className="px-5 py-10 text-center">
              <div className="w-6 h-6 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
            </div>
          )}
          {!loading && transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                t.type === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {t.type === 'CREDIT' ? '⬆️' : '⬇️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{t.description}</div>
                <div className="text-xs text-gray-400">{formatDate(t.createdAt)}</div>
              </div>
              <div className={`font-bold text-sm ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'CREDIT' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}₫
              </div>
            </div>
          ))}
          {!loading && transactions.length === 0 && (
            <div className="px-5 py-10 text-center text-gray-400 font-medium">Chưa có giao dịch nào</div>
          )}
        </div>
      </div>
    </div>
  );
}
