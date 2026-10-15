import { Link } from 'react-router';

const stats = [
  { label: 'Tổng đơn hàng', value: '24', icon: '📦', color: 'bg-blue-50 text-blue-600', delta: '+3 tuần này' },
  { label: 'Đang giao', value: '3', icon: '🚗', color: 'bg-amber-50 text-amber-600', delta: 'Đang cập nhật' },
  { label: 'Hoàn thành', value: '18', icon: '✅', color: 'bg-green-50 text-green-600', delta: '75% tỉ lệ' },
  { label: 'Chờ xử lý', value: '3', icon: '⏳', color: 'bg-purple-50 text-purple-600', delta: '2 giờ TB' },
];

const recentOrders = [
  { code: 'SPD-001', status: 'IN_TRANSIT', address: '123 Nguyễn Trãi, Q1', price: '35,000₫', time: '14:30', driver: 'Minh Khoa' },
  { code: 'SPD-002', status: 'DELIVERED', address: '56 Lê Lợi, Q3', price: '28,000₫', time: '11:15', driver: 'Văn Hùng' },
  { code: 'SPD-003', status: 'PENDING', address: '89 Trần Hưng Đạo, Q5', price: '42,000₫', time: '09:00', driver: '—' },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'Chờ xử lý', cls: 'badge-pending' },
  IN_TRANSIT: { label: 'Đang giao',  cls: 'badge-transit' },
  DELIVERED:  { label: 'Hoàn thành', cls: 'badge-delivered' },
  CANCELLED:  { label: 'Đã hủy',     cls: 'badge-cancelled' },
};

export default function CustomerDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>
            Xin chào, Nguyễn Văn An 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Thứ Ba, 09 tháng 9 năm 2026</p>
        </div>
        <Link to="/orders/new"
          className="bg-red-gradient text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-red-200 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center gap-2">
          <span>➕</span> Tạo đơn mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover transition-all duration-200">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <div className="text-3xl font-black text-gray-900 mb-0.5" style={{ fontFamily: 'Nunito' }}>{s.value}</div>
            <div className="text-sm font-medium text-gray-600">{s.label}</div>
            <div className="text-xs text-gray-400 mt-1">{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Banner promo */}
      <div className="bg-red-gradient rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full translate-x-16 -translate-y-8" />
        <div className="relative z-10">
          <div className="text-white/80 text-sm font-medium mb-1">Ưu đãi hôm nay</div>
          <div className="text-white text-2xl font-black mb-1" style={{ fontFamily: 'Nunito' }}>Giảm 20K đơn đầu</div>
          <div className="text-white/80 text-sm">Dùng mã: <span className="bg-white/20 px-2 py-0.5 rounded-lg font-mono font-bold">SPEED20K</span></div>
        </div>
        <Link to="/vouchers" className="relative z-10 bg-white text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm hover:shadow-lg transition-all duration-200 shrink-0">
          Xem voucher →
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-lg" style={{ fontFamily: 'Nunito' }}>Đơn hàng gần đây</h2>
          <Link to="/orders" className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">Xem tất cả →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentOrders.map((o) => {
            const s = statusMap[o.status];
            return (
              <div key={o.code} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900 text-sm">{o.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">{o.address}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900 text-sm">{o.price}</div>
                  <div className="text-xs text-gray-400">{o.time}</div>
                </div>
                <Link to={`/orders/1`} className="text-red-500 hover:text-red-600 text-sm ml-1">→</Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '📋', label: 'Theo dõi đơn', path: '/orders', color: 'bg-blue-50 text-blue-600' },
          { icon: '🎟️', label: 'Voucher của tôi', path: '/vouchers', color: 'bg-green-50 text-green-600' },
          { icon: '👤', label: 'Hồ sơ', path: '/profile', color: 'bg-purple-50 text-purple-600' },
        ].map((q) => (
          <Link key={q.label} to={q.path}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center gap-2 card-hover transition-all duration-200 text-center">
            <div className={`w-12 h-12 ${q.color} rounded-xl flex items-center justify-center text-2xl`}>{q.icon}</div>
            <span className="text-sm font-semibold text-gray-700">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
