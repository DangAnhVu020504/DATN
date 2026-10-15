import { useState } from 'react';
import { Link } from 'react-router';

const ALL_ORDERS = [
  { id: 1, code: 'SPD-2026-001', status: 'IN_TRANSIT', address: '56 Lê Lợi, Q3, TP.HCM', price: '35,000₫', date: '09/09/2026', driver: 'Trần Minh Khoa' },
  { id: 2, code: 'SPD-2026-002', status: 'DELIVERED',  address: '89 Trần Hưng Đạo, Q5', price: '28,000₫', date: '08/09/2026', driver: 'Lê Văn Hùng' },
  { id: 3, code: 'SPD-2026-003', status: 'PENDING',    address: '12 Nguyễn Huệ, Q1',    price: '42,000₫', date: '08/09/2026', driver: '—' },
  { id: 4, code: 'SPD-2026-004', status: 'CANCELLED',  address: '34 Cách Mạng Tháng 8', price: '50,000₫', date: '07/09/2026', driver: '—' },
  { id: 5, code: 'SPD-2026-005', status: 'DELIVERED',  address: '67 Đinh Tiên Hoàng',   price: '22,000₫', date: '06/09/2026', driver: 'Nguyễn Văn Bình' },
  { id: 6, code: 'SPD-2026-006', status: 'CONFIRMED',  address: '90 Võ Thị Sáu, Q3',    price: '38,000₫', date: '09/09/2026', driver: 'Phạm Quốc Toản' },
];

const STATUS_TABS = [
  { key: 'ALL',        label: 'Tất cả' },
  { key: 'PENDING',    label: 'Chờ xử lý' },
  { key: 'IN_TRANSIT', label: 'Đang giao' },
  { key: 'DELIVERED',  label: 'Hoàn thành' },
  { key: 'CANCELLED',  label: 'Đã hủy' },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'Chờ xử lý', cls: 'badge-pending' },
  CONFIRMED:  { label: 'Xác nhận',  cls: 'badge-confirmed' },
  IN_TRANSIT: { label: 'Đang giao', cls: 'badge-transit' },
  DELIVERED:  { label: 'Hoàn thành',cls: 'badge-delivered' },
  CANCELLED:  { label: 'Đã hủy',    cls: 'badge-cancelled' },
};

export default function OrderListPage() {
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = ALL_ORDERS.filter(o =>
    (tab === 'ALL' || o.status === tab) &&
    (o.code.toLowerCase().includes(search.toLowerCase()) || o.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Đơn hàng của tôi</h1>
          <p className="text-gray-500 text-sm mt-0.5">{ALL_ORDERS.length} đơn hàng tổng cộng</p>
        </div>
        <Link to="/orders/new" className="bg-red-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 transition-all flex items-center gap-2">
          ➕ Tạo đơn
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn hoặc địa chỉ..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tab === t.key ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-medium">Không có đơn hàng nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(o => {
              const s = statusMap[o.status];
              return (
                <div key={o.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg shrink-0">📦</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{o.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{o.address}</div>
                    <div className="text-xs text-gray-400">Tài xế: {o.driver}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-gray-900 text-sm">{o.price}</div>
                    <div className="text-xs text-gray-400">{o.date}</div>
                  </div>
                  <Link to={`/orders/${o.id}`} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition-colors">→</Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-400">{filtered.length} kết quả</p>
        <div className="flex gap-1">
          {[1, 2, 3].map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                page === p ? 'bg-red-gradient text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
