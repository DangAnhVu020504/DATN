import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { driverService } from '@/services/driverService';
import type { OrderResponse } from '@/types';

const formatPrice = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + '₫';

export default function DriverDashboard() {
  const { user } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const driverId = user?.driverId;
  const [online, setOnline] = useState(true);
  const [earnings, setEarnings] = useState<number | null>(null);
  const [history, setHistory] = useState<OrderResponse[]>([]);
  const [newOrders, setNewOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!driverId) { setLoading(false); return; }
    Promise.all([
      driverService.getEarnings(driverId),
      driverService.getDeliveryHistory(driverId, 0, 20),
      driverService.getAvailableOrders(driverId),
    ])
      .then(([earnRes, histRes, availRes]) => {
        setEarnings(earnRes.data.data);
        setHistory(histRes.data.data?.content ?? []);
        setNewOrders(availRes.data.data ?? []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [driverId]);

  useEffect(() => { load(); }, [load]);

  const activeOrders = history.filter((o) => ['ASSIGNED', 'PICKING_UP', 'IN_TRANSIT'].includes(o.status));
  const deliveredToday = history.filter((o) => o.status === 'DELIVERED');

  const toggleOnline = async () => {
    if (!driverId) return;
    const next = !online;
    setOnline(next);
    try {
      await driverService.toggleAvailability(driverId, next);
    } catch {
      setOnline(!next);
    }
  };

  const handleAccept = async (orderId: number) => {
    if (!driverId) return;
    setActing(orderId);
    try {
      await driverService.acceptOrder(driverId, orderId);
      setNewOrders((os) => os.filter((o) => o.id !== orderId));
      load();
      navigate('/driver/orders');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Nhận đơn thất bại');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (orderId: number) => {
    if (!driverId) return;
    setActing(orderId);
    try {
      await driverService.rejectOrder(driverId, orderId);
      setNewOrders((os) => os.filter((o) => o.id !== orderId));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Từ chối thất bại');
    } finally {
      setActing(null);
    }
  };

  const stats = [
    { label: 'Thu nhập', value: earnings != null ? formatPrice(earnings) : '—', icon: '💵', color: 'bg-green-50 text-green-600' },
    { label: 'Đang giao', value: String(activeOrders.length), icon: '🚗', color: 'bg-amber-50 text-amber-600' },
    { label: 'Đã giao', value: String(deliveredToday.length), icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Trạng thái', value: online ? 'Online' : 'Offline', icon: '📡', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>
            Xin chào, {user?.fullName?.split(' ').pop() ?? 'tài xế'} 🚗
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <button onClick={toggleOnline}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm ${
            online ? 'bg-green-500 text-white shadow-green-200' : 'bg-gray-200 text-gray-600'
          }`}>
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {online ? 'Đang nhận đơn' : 'Offline'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover transition-all duration-200">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <div className="text-xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* New orders - available to accept */}
      {newOrders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900 text-lg" style={{ fontFamily: 'Nunito' }}>🆕 Đơn hàng mới</h2>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">{newOrders.length} đơn chờ nhận</span>
          </div>
          {!online && (
            <p className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              ⚠️ Bạn đang Offline — bật "Đang nhận đơn" để có thể nhận các đơn này.
            </p>
          )}
          <div className="space-y-3">
            {newOrders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900 text-sm font-mono">{o.orderCode}</span>
                  <span className="font-bold text-red-600">{formatPrice(o.totalPrice)}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 shrink-0 mt-0.5">⬆</span>
                    <span className="text-gray-600">{o.pickupAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 shrink-0 mt-0.5">⬇</span>
                    <span className="text-gray-600">{o.deliveryAddress}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => handleReject(o.id)} disabled={acting === o.id}
                    className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60">
                    Từ chối
                  </button>
                  <button onClick={() => handleAccept(o.id)} disabled={acting === o.id || !online}
                    className="px-4 py-1.5 bg-red-gradient text-white rounded-lg text-xs font-semibold shadow-md shadow-red-200 hover:opacity-90 transition-all disabled:opacity-60">
                    {acting === o.id ? 'Đang xử lý...' : '✅ Nhận đơn'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900 text-lg" style={{ fontFamily: 'Nunito' }}>Đơn đang giao</h2>
            <span className="bg-amber-100 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full">{activeOrders.length} đơn</span>
          </div>
          <div className="space-y-3">
            {activeOrders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900 text-sm font-mono">{o.orderCode}</span>
                  <span className="font-bold text-red-600">{formatPrice(o.totalPrice)}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 shrink-0 mt-0.5">⬆</span>
                    <span className="text-gray-600">{o.pickupAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 shrink-0 mt-0.5">⬇</span>
                    <span className="text-gray-600">{o.deliveryAddress}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Link to="/driver/orders"
                    className="px-4 py-1.5 bg-red-gradient text-white rounded-lg text-xs font-semibold shadow-md shadow-red-200 hover:opacity-90 transition-all">
                    Tiếp tục giao →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900 text-lg" style={{ fontFamily: 'Nunito' }}>Đơn hàng gần đây</h2>
          <Link to="/driver/orders" className="text-sm font-semibold text-red-600 hover:text-red-700">Xem tất cả →</Link>
        </div>
        <div className="space-y-3">
          {loading && (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
            </div>
          )}
          {!loading && history.slice(0, 3).map((o) => (
            <Link key={o.id} to="/driver/orders"
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-sm font-mono">{o.orderCode}</span>
                <span className="font-bold text-red-600">{formatPrice(o.totalPrice)}</span>
              </div>
              <div className="text-xs text-gray-400 truncate">{o.pickupAddress} → {o.deliveryAddress}</div>
            </Link>
          ))}
          {!loading && history.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400 text-sm">
              Chưa có đơn hàng nào
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '📋', label: 'Lịch sử giao', path: '/driver/orders', color: 'bg-blue-50 text-blue-600' },
          { icon: '💰', label: 'Ví tiền', path: '/driver/wallet', color: 'bg-green-50 text-green-600' },
          { icon: '⭐', label: 'Đánh giá', path: '/driver/reviews', color: 'bg-amber-50 text-amber-600' },
        ].map((q) => (
          <Link key={q.label} to={q.path}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 card-hover transition-all duration-200 text-center">
            <div className={`w-11 h-11 ${q.color} rounded-xl flex items-center justify-center text-2xl`}>{q.icon}</div>
            <span className="text-xs font-semibold text-gray-700">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
