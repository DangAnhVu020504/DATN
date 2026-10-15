import { useState } from 'react';

const ORDERS = [
  { id: 1, code: 'SPD-2026-045', customer: 'Nguyễn Văn An', from: '123 Nguyễn Trãi, Q1', to: '56 Lê Lợi, Q3', status: 'IN_TRANSIT', price: '55,000₫', date: '09/09 14:30' },
  { id: 2, code: 'SPD-2026-044', customer: 'Trần Thị B', from: '78 CMT8, Q3', to: '12 Nguyễn Huệ, Q1', status: 'DELIVERED', price: '35,000₫', date: '09/09 11:15' },
  { id: 3, code: 'SPD-2026-043', customer: 'Lê Văn C', from: '45 Võ Thị Sáu, Q3', to: '89 Trần Hưng Đạo, Q5', status: 'DELIVERED', price: '42,000₫', date: '08/09 16:00' },
  { id: 4, code: 'SPD-2026-042', customer: 'Phạm Thị D', from: '67 Đinh Tiên Hoàng', to: '23 Phan Xích Long, PN', status: 'CANCELLED', price: '28,000₫', date: '08/09 09:30' },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  IN_TRANSIT: { label: 'Đang giao', cls: 'badge-transit' },
  DELIVERED:  { label: 'Hoàn thành', cls: 'badge-delivered' },
  CANCELLED:  { label: 'Đã hủy', cls: 'badge-cancelled' },
};

export default function DriverOrdersPage() {
  const [tab, setTab] = useState('ALL');
  const filtered = ORDERS.filter((o) => tab === 'ALL' || o.status === tab);

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Lịch sử giao hàng</h1>
        <p className="text-gray-500 text-sm mt-0.5">{ORDERS.length} đơn hàng</p>
      </div>

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
        {filtered.map((o) => {
          const s = statusMap[o.status];
          return (
            <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm font-mono">{o.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600 text-sm">{o.price}</div>
                  <div className="text-xs text-gray-400">{o.date}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2">👤 {o.customer}</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-green-500">⬆</span> {o.from}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-red-500">⬇</span> {o.to}
                </div>
              </div>
              {o.status === 'IN_TRANSIT' && (
                <button className="mt-3 w-full py-2 bg-red-gradient text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all">
                  ✅ Hoàn thành giao hàng
                </button>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400 font-medium">Chưa có đơn hàng nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
