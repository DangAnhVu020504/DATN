const stats = [
  { label: 'Tổng đơn hàng', value: '1,247', delta: '+12%', icon: '📦', color: 'bg-blue-50 text-blue-600', deltaColor: 'text-green-600' },
  { label: 'Khách hàng', value: '856', delta: '+8%', icon: '👥', color: 'bg-purple-50 text-purple-600', deltaColor: 'text-green-600' },
  { label: 'Tài xế', value: '124', delta: '+3%', icon: '🚗', color: 'bg-amber-50 text-amber-600', deltaColor: 'text-green-600' },
  { label: 'Doanh thu', value: '125.6M₫', delta: '+15%', icon: '💰', color: 'bg-green-50 text-green-600', deltaColor: 'text-green-600' },
];

const orderStatuses = [
  { label: 'Chờ xử lý', value: 23, total: 1247, color: 'bg-amber-500' },
  { label: 'Đang giao', value: 45, total: 1247, color: 'bg-blue-500' },
  { label: 'Hoàn thành', value: 1150, total: 1247, color: 'bg-green-500' },
  { label: 'Đã hủy', value: 29, total: 1247, color: 'bg-red-500' },
];

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Tổng quan hệ thống</h1>
        <p className="text-gray-500 text-sm mt-0.5">Thứ Ba, 09 tháng 9 năm 2026</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover transition-all duration-200">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <div className="text-2xl font-black text-gray-900 mb-0.5" style={{ fontFamily: 'Nunito' }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-xs font-semibold mt-1 ${s.deltaColor}`}>↑ {s.delta} so với tháng trước</div>
          </div>
        ))}
      </div>

      {/* Order status breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <h2 className="font-black text-gray-900 text-lg mb-5" style={{ fontFamily: 'Nunito' }}>Phân bổ trạng thái đơn hàng</h2>
        <div className="space-y-4">
          {orderStatuses.map(s => {
            const pct = Math.round((s.value / s.total) * 100);
            return (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">{s.value.toLocaleString()}</span>
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

      {/* Summary grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">👥 Top tài xế tuần này</h3>
          <div className="space-y-3">
            {[
              { name: 'Trần Minh Khoa', orders: 28, earn: '980K₫' },
              { name: 'Lê Văn Hùng', orders: 24, earn: '840K₫' },
              { name: 'Nguyễn Bình', orders: 22, earn: '770K₫' },
            ].map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-800">{d.name}</div>
                  <div className="text-xs text-gray-400">{d.orders} đơn</div>
                </div>
                <span className="text-xs font-bold text-green-600">{d.earn}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">📊 Doanh thu 7 ngày</h3>
          <div className="space-y-2">
            {['T3','T4','T5','T6','T7','CN','T2'].map((day, i) => {
              const h = [60, 45, 80, 55, 90, 70, 65][i];
              return (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5">{day}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-gradient rounded-full" style={{ width: `${h}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-12 text-right">{(h * 178).toLocaleString()}K</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">🔔 Hoạt động gần đây</h3>
          <div className="space-y-3">
            {[
              { icon: '👤', text: 'Khách hàng mới đăng ký', time: '5p trước' },
              { icon: '📦', text: 'Đơn SPD-047 hoàn thành', time: '12p trước' },
              { icon: '🚗', text: 'Tài xế Khoa đăng ký', time: '1h trước' },
              { icon: '⚠️', text: 'Đơn SPD-039 bị hủy', time: '2h trước' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{a.icon}</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-700">{a.text}</div>
                  <div className="text-xs text-gray-400">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
