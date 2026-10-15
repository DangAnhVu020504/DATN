import { useState } from 'react';
import { Link } from 'react-router';

const NEW_ORDERS = [
  { id: 'SPD-001', from: '123 Nguyễn Trãi, Q1', to: '56 Lê Lợi, Q3', price: '55,000₫', dist: '3.2 km', type: 'EXPRESS' },
  { id: 'SPD-002', from: '78 CMT8, Q3', to: '90 Đinh Tiên Hoàng, Q1', price: '35,000₫', dist: '2.1 km', type: 'STANDARD' },
];

export default function DriverDashboard() {
  const [online, setOnline] = useState(true);

  const stats = [
    { label: 'Thu nhập hôm nay', value: '320,000₫', icon: '💵', color: 'bg-green-50 text-green-600' },
    { label: 'Đơn đã giao', value: '8', icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Đánh giá', value: '4.8 ⭐', icon: '⭐', color: 'bg-amber-50 text-amber-600' },
    { label: 'Quãng đường', value: '34 km', icon: '🗺️', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Xin chào, Khoa 🚗</h1>
          <p className="text-gray-500 text-sm mt-0.5">Thứ Ba, 09 tháng 9 năm 2026</p>
        </div>
        <button onClick={() => setOnline(!online)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm ${
            online ? 'bg-green-500 text-white shadow-green-200' : 'bg-gray-200 text-gray-600'}`}>
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {online ? 'Đang nhận đơn' : 'Offline'}
        </button>
      </div>

      {/* Status banner */}
      {!online && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
          <span className="text-amber-500">⚠️</span>
          <span className="text-amber-700 text-sm font-medium">Bạn đang offline. Bật trạng thái để nhận đơn hàng mới.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover transition-all duration-200">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <div className="text-xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* New orders */}
      {online && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900 text-lg" style={{ fontFamily: 'Nunito' }}>Đơn hàng mới</h2>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">{NEW_ORDERS.length} đơn</span>
          </div>
          <div className="space-y-3">
            {NEW_ORDERS.map(o => (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900 text-sm">{o.id}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.type === 'EXPRESS' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {o.type === 'EXPRESS' ? '⚡ Hỏa tốc' : '🚗 TC'}
                    </span>
                    <span className="font-bold text-red-600">{o.price}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 shrink-0 mt-0.5">⬆</span>
                    <span className="text-gray-600">{o.from}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 shrink-0 mt-0.5">⬇</span>
                    <span className="text-gray-600">{o.to}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">📍 {o.dist}</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                      Từ chối
                    </button>
                    <button className="px-4 py-1.5 bg-red-gradient text-white rounded-lg text-xs font-semibold shadow-md shadow-red-200 hover:opacity-90 transition-all">
                      ✅ Nhận đơn
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '📋', label: 'Lịch sử giao', path: '/driver/orders', color: 'bg-blue-50 text-blue-600' },
          { icon: '💰', label: 'Ví tiền', path: '/driver/wallet', color: 'bg-green-50 text-green-600' },
          { icon: '⭐', label: 'Đánh giá', path: '/driver/reviews', color: 'bg-amber-50 text-amber-600' },
        ].map(q => (
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
