import { useCallback, useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { orderService } from '@/services/orderService';
import type { OrderResponse } from '@/types';

const STATUS_OPTS = ['ALL', 'PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKING_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'Chờ xử lý', cls: 'badge-pending' },
  CONFIRMED:  { label: 'Xác nhận',  cls: 'badge-confirmed' },
  ASSIGNED:   { label: 'Gán TX',    cls: 'badge-assigned' },
  PICKING_UP: { label: 'Lấy hàng',  cls: 'badge-picking' },
  PICKED_UP:  { label: 'Đã lấy hàng', cls: 'badge-picked' },
  IN_TRANSIT: { label: 'Đang giao', cls: 'badge-transit' },
  DELIVERED:  { label: 'Hoàn thành', cls: 'badge-delivered' },
  FAILED:     { label: 'Thất bại',  cls: 'badge-cancelled' },
  CANCELLED:  { label: 'Đã hủy',    cls: 'badge-cancelled' },
};

export default function AdminOrdersPage() {
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminService
      .getOrders(0, 200)
      .then((res) => setOrders(res.data.data?.content ?? []))
      .catch(() => setError('Không thể tải danh sách đơn hàng'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(
    (o) =>
      (tab === 'ALL' || o.status === tab) &&
      (o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdatingId(orderId);
    setError('');
    try {
      const res = await orderService.updateStatus(orderId, status);
      setOrders((os) => os.map((o) => (o.id === orderId ? res.data.data : o)));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Quản lý đơn hàng</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} đơn hàng</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">⚠️ {error}</div>
      )}

      {/* Search */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mã đơn hoặc khách hàng..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white transition-all duration-200"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {STATUS_OPTS.slice(0, 7).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tab === s ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : statusMap[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Mã đơn', 'Khách hàng', 'Tài xế', 'Trạng thái', 'Giá', 'Ngày', 'Hành động'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <div className="w-6 h-6 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            )}
            {!loading && filtered.map((o) => {
              const s = statusMap[o.status] ?? { label: o.status, cls: 'badge-pending' };
              return (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 font-mono">{o.orderCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.driverName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600">{o.totalPrice?.toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(o.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    {updatingId === o.id ? (
                      <div className="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 hover:border-red-300 transition-colors"
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      >
                        {STATUS_OPTS.slice(1).map((s2) => (
                          <option key={s2} value={s2}>
                            {statusMap[s2]?.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Không tìm thấy đơn hàng nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}