import { useState } from 'react';

const ORDERS = [
  { id: 1, code: 'SPD-2026-047', customer: 'Nguyễn Văn An', driver: 'Trần Minh Khoa', status: 'IN_TRANSIT', price: '55,000₫', date: '09/09/2026 14:30' },
  { id: 2, code: 'SPD-2026-046', customer: 'Lê Thị Mai', driver: 'Lê Văn Hùng', status: 'DELIVERED', price: '35,000₫', date: '09/09/2026 11:15' },
  { id: 3, code: 'SPD-2026-045', customer: 'Phạm Thị D', driver: '—', status: 'PENDING', price: '42,000₫', date: '09/09/2026 09:00' },
  { id: 4, code: 'SPD-2026-044', customer: 'Hoàng Minh E', driver: 'Nguyễn Bình', status: 'CANCELLED', price: '28,000₫', date: '08/09/2026 16:45' },
  { id: 5, code: 'SPD-2026-043', customer: 'Võ Thị F', driver: 'Trần Minh Khoa', status: 'DELIVERED', price: '38,000₫', date: '08/09/2026 14:00' },
];

const STATUS_OPTS = ['ALL', 'PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKING_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'Chờ xử lý', cls: 'badge-pending' },
  CONFIRMED:  { label: 'Xác nhận',  cls: 'badge-confirmed' },
  ASSIGNED:   { label: 'Gán TX',    cls: 'badge-assigned' },
  PICKING_UP: { label: 'Lấy hàng',  cls: 'badge-picking' },
  IN_TRANSIT: { label: 'Đang giao', cls: 'badge-transit' },
  DELIVERED:  { label: 'Hoàn thành', cls: 'badge-delivered' },
  CANCELLED:  { label: 'Đã hủy',    cls: 'badge-cancelled' },
};

export default function AdminOrdersPage() {
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState(ORDERS);

  const filtered = orders.filter(
    (o) =>
      (tab === 'ALL' || o.status === tab) &&
      (o.code.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Quản lý đơn hàng</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} đơn hàng</p>
        </div>
      </div>

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
            {filtered.map((o) => {
              const s = statusMap[o.status];
              return (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 font-mono">{o.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.customer}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.driver}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600">{o.price}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{o.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 hover:border-red-300 transition-colors"
                        value={o.status}
                        onChange={(e) =>
                          setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: e.target.value } : x)))
                        }
                      >
                        {STATUS_OPTS.slice(1).map((s2) => (
                          <option key={s2} value={s2}>
                            {statusMap[s2]?.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setOrders((os) => os.filter((x) => x.id !== o.id))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        title="Xóa"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Không tìm thấy đơn hàng nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
