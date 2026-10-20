import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { adminService } from '@/services/adminService';
import type { DashboardResponse, OrderResponse } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', ASSIGNED: 'Đã phân công',
  PICKING_UP: 'Đang lấy hàng', PICKED_UP: 'Đã lấy hàng', IN_TRANSIT: 'Đang giao',
  DELIVERED: 'Hoàn thành', FAILED: 'Thất bại', CANCELLED: 'Đã hủy',
};

export default function AdminDashboard() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    Promise.all([
      adminService.getDashboard(),
      adminService.getOrders(0, 5),
    ])
      .then(([dashRes, ordersRes]) => {
        setData(dashRes.data.data);
        setRecentOrders(ordersRes.data.data?.content ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Tổng đơn hàng', value: (data?.totalOrders ?? 0).toLocaleString('vi-VN'), icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Khách hàng', value: (data?.totalCustomers ?? 0).toLocaleString('vi-VN'), icon: '👥', color: 'bg-purple-50 text-purple-600' },
    { label: 'Tài xế', value: (data?.totalDrivers ?? 0).toLocaleString('vi-VN'), icon: '🚗', color: 'bg-amber-50 text-amber-600' },
    { label: 'Doanh thu', value: `${(data?.totalRevenue ?? 0).toLocaleString('vi-VN')}₫`, icon: '💰', color: 'bg-green-50 text-green-600' },
  ];

  const totalOrders = data?.totalOrders ?? 0;
  const orderStatuses = [
    { label: 'Chờ xử lý', value: data?.pendingOrders ?? 0, color: 'bg-amber-500' },
    { label: 'Đang giao', value: data?.deliveringOrders ?? 0, color: 'bg-blue-500' },
    { label: 'Hoàn thành', value: data?.completedOrders ?? 0, color: 'bg-green-500' },
    { label: 'Đã hủy', value: data?.cancelledOrders ?? 0, color: 'bg-red-500' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Tổng quan hệ thống</h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover transition-all duration-200">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <div className="text-2xl font-black text-gray-900 mb-0.5 truncate" style={{ fontFamily: 'Nunito' }}>
              {loading ? '...' : s.value}
            </div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Order status breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <h2 className="font-black text-gray-900 text-lg mb-5" style={{ fontFamily: 'Nunito' }}>Phân bổ trạng thái đơn hàng</h2>
        <div className="space-y-4">
          {orderStatuses.map((s) => {
            const pct = totalOrders ? Math.round((s.value / totalOrders) * 100) : 0;
            return (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">{s.value.toLocaleString('vi-VN')}</span>
                    <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${s.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm">📦 Đơn hàng gần đây</h3>
          <Link to="/admin/orders" className="text-xs font-semibold text-red-600 hover:text-red-700">Xem tất cả →</Link>
        </div>
        {loading && (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loading && recentOrders.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">Chưa có đơn hàng nào</p>
        )}
        <div className="divide-y divide-gray-50">
          {recentOrders.map((o) => (
            <div key={o.id} className="flex items-center gap-3 py-3">
              <span className="font-mono text-xs font-bold text-gray-900">{o.orderCode}</span>
              <span className="text-xs text-gray-400 flex-1 truncate">{o.customerName}</span>
              <span className="text-xs text-gray-500">{STATUS_LABELS[o.status] ?? o.status}</span>
              <span className="text-xs font-bold text-red-600">{o.totalPrice?.toLocaleString('vi-VN')}₫</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links (hidden on print) */}
      <div className="grid grid-cols-3 gap-4 mt-5">
        {[
          { icon: '📦', label: 'Quản lý đơn', path: '/admin/orders', color: 'bg-blue-50 text-blue-600' },
          { icon: '👥', label: 'Người dùng', path: '/admin/users', color: 'bg-purple-50 text-purple-600' },
          { icon: '📜', label: 'Audit Logs', path: '/admin/logs', color: 'bg-gray-100 text-gray-600' },
        ].map((q) => (
          <Link key={q.label} to={q.path}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 card-hover transition-all duration-200 text-center">
            <div className={`w-11 h-11 ${q.color} rounded-xl flex items-center justify-center text-2xl`}>{q.icon}</div>
            <span className="text-xs font-semibold text-gray-700">{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Admin badge */}
      <div className="mt-5 text-center">
        <span className="text-xs text-gray-300">Đăng nhập với quyền: {user?.roles?.join(', ')}</span>
      </div>
    </div>
  );
}
