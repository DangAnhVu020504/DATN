import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { orderService } from '@/services/orderService';
import type { OrderResponse } from '@/types';

const STATUS_TABS = ['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'Chờ xử lý', cls: 'badge-pending' },
  CONFIRMED:  { label: 'Xác nhận',  cls: 'badge-confirmed' },
  ASSIGNED:   { label: 'Gán tài xế', cls: 'badge-assigned' },
  PICKING_UP: { label: 'Đang lấy hàng', cls: 'badge-picking' },
  IN_TRANSIT: { label: 'Đang giao',  cls: 'badge-transit' },
  DELIVERED:  { label: 'Hoàn thành', cls: 'badge-delivered' },
  CANCELLED:  { label: 'Đã hủy',     cls: 'badge-cancelled' },
};

const formatPrice = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + '₫';
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function OrderListPage() {
  const customerId = useSelector((s: RootState) => s.auth.user?.customerId);
  const navigate = useNavigate();
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackCode, setTrackCode] = useState('');
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  const trackOrder = async () => {
    if (!trackCode.trim()) return;
    setTracking(true);
    setTrackError(null);
    try {
      const res = await orderService.getOrderByCode(trackCode.trim().toUpperCase());
      navigate(`/orders/${res.data.data.id}`);
    } catch (e: any) {
      setTrackError(e.response?.data?.message || 'Không tìm thấy đơn hàng với mã này');
    } finally {
      setTracking(false);
    }
  };

  useEffect(() => {
    if (!customerId) {
      setError('Không xác định được khách hàng. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }
    setLoading(true);
    orderService.getCustomerOrders(customerId, 0, 50)
      .then((res) => { setOrders(res.data.data.content); setError(null); })
      .catch((e) => setError(e.response?.data?.message || 'Không thể tải danh sách đơn hàng'))
      .finally(() => setLoading(false));
  }, [customerId]);

  const filtered = orders.filter((o) =>
    (tab === 'ALL' || o.status === tab) &&
    (o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(search.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Đơn hàng của tôi</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} đơn hàng</p>
        </div>
        <Link to="/orders/new"
          className="bg-red-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 flex items-center gap-2">
          ➕ Tạo đơn mới
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã đơn hoặc địa chỉ..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white transition-all duration-200" />
      </div>

      {/* Track by order code */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-700 shrink-0">📦 Tra cứu đơn theo mã</span>
        <input
          value={trackCode}
          onChange={(e) => { setTrackCode(e.target.value.toUpperCase()); setTrackError(null); }}
          onKeyDown={(e) => e.key === 'Enter' && trackOrder()}
          placeholder="VD: SPD1A2B3C4D"
          className="flex-1 min-w-40 px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono uppercase bg-gray-50 transition-all duration-200"
        />
        <button onClick={trackOrder} disabled={tracking || !trackCode.trim()}
          className="px-5 py-2 bg-red-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 disabled:opacity-60">
          {tracking ? 'Đang tìm...' : 'Tra cứu'}
        </button>
        {trackError && <p className="w-full text-xs text-red-600 font-medium">❌ {trackError}</p>}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tab === s ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {s === 'ALL' ? 'Tất cả' : statusMap[s]?.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Đang tải đơn hàng...</p>
        </div>
      )}
      {!loading && error && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-gray-500 font-medium">{error}</p>
        </div>
      )}

      {/* Orders list */}
      {!loading && !error && (
      <div className="space-y-3">
        {filtered.map((o) => {
          const s = statusMap[o.status];
          return (
            <Link key={o.id} to={`/orders/${o.id}`}
              className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg shrink-0">📦</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 text-sm font-mono">{o.orderCode}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s?.label || o.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(o.createdAt)}</div>
                  </div>
                </div>
                <div className="text-lg font-black text-red-600" style={{ fontFamily: 'Nunito' }}>{formatPrice(o.totalPrice)}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="text-green-500">🟢</span>
                <span className="truncate">{o.pickupAddress} → {o.deliveryAddress}</span>
              </div>
              {o.driverName && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <div className="w-5 h-5 bg-red-gradient rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {o.driverName.charAt(0)}
                  </div>
                  Tài xế: <span className="font-semibold text-gray-700">{o.driverName}</span>
                </div>
              )}
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-400 font-medium">Không tìm thấy đơn hàng nào</p>
            <Link to="/orders/new" className="inline-block mt-4 text-sm font-bold text-red-600 hover:text-red-700">Tạo đơn đầu tiên →</Link>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
