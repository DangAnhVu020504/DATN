import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { driverService } from '@/services/driverService';
import type { OrderResponse } from '@/types';

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'Chờ xử lý', cls: 'badge-pending' },
  CONFIRMED:  { label: 'Đã xác nhận', cls: 'badge-confirmed' },
  ASSIGNED:   { label: 'Đã phân công', cls: 'badge-assigned' },
  PICKING_UP: { label: 'Đang lấy hàng', cls: 'badge-picking' },
  PICKED_UP:  { label: 'Đã lấy hàng', cls: 'badge-picked' },
  IN_TRANSIT: { label: 'Đang giao', cls: 'badge-transit' },
  DELIVERED:  { label: 'Hoàn thành', cls: 'badge-delivered' },
  FAILED:     { label: 'Thất bại', cls: 'badge-cancelled' },
  CANCELLED:  { label: 'Đã hủy', cls: 'badge-cancelled' },
};

const ACTIVE_STATUSES = ['CONFIRMED', 'ASSIGNED', 'PICKING_UP', 'PICKED_UP', 'IN_TRANSIT'];

export default function DriverOrdersPage() {
  const driverId = useSelector((s: RootState) => s.auth.user?.driverId);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!driverId) return;
    setLoading(true);
    driverService
      .getDeliveryHistory(driverId, 0, 100)
      .then((res) => setOrders(res.data.data?.content ?? []))
      .catch(() => setError('Không thể tải lịch sử giao hàng'))
      .finally(() => setLoading(false));
  }, [driverId]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    if (tab === 'ALL') return true;
    if (tab === 'IN_TRANSIT') return ACTIVE_STATUSES.includes(o.status);
    if (tab === 'DELIVERED') return o.status === 'DELIVERED';
    return ['CANCELLED', 'FAILED'].includes(o.status);
  });

  const handleComplete = async (orderId: number) => {
    if (!driverId) return;
    setCompletingId(orderId);
    setError('');
    try {
      await driverService.completeDelivery(driverId, orderId);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể hoàn thành đơn hàng');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Lịch sử giao hàng</h1>
        <p className="text-gray-500 text-sm mt-0.5">{orders.length} đơn hàng</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">⚠️ {error}</div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {[['ALL', 'Tất cả'], ['IN_TRANSIT', 'Đang giao'], ['DELIVERED', 'Hoàn thành'], ['CANCELLED', 'Đã hủy']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tab === k ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-8 h-8 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Đang tải đơn hàng...</p>
          </div>
        )}

        {!loading && filtered.map((o) => {
          const s = statusMap[o.status] ?? { label: o.status, cls: 'badge-pending' };
          const isActive = ACTIVE_STATUSES.includes(o.status);
          return (
            <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm font-mono">{o.orderCode}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600 text-sm">{o.totalPrice?.toLocaleString('vi-VN')}₫</div>
                  <div className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2">👤 {o.customerName} · {o.deliveryContactPhone}</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-green-500">⬆</span> {o.pickupAddress}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-red-500">⬇</span> {o.deliveryAddress}
                </div>
              </div>
              {isActive && (
                <button onClick={() => handleComplete(o.id)} disabled={completingId === o.id}
                  className="mt-3 w-full py-2 bg-red-gradient text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {completingId === o.id
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang xử lý...</>
                    : '✅ Hoàn thành giao hàng'}
                </button>
              )}
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400 font-medium">Chưa có đơn hàng nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
