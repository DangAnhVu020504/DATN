import { useState } from 'react';

interface Notif {
  id: number;
  icon: string;
  color: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const INIT: Notif[] = [
  { id: 1, icon: '🚗', color: 'bg-green-50', title: 'Tài xế đã nhận đơn SPD-047', body: 'Trần Minh Khoa đang trên đường đến điểm lấy hàng của bạn.', time: '5 phút trước', unread: true },
  { id: 2, icon: '📦', color: 'bg-blue-50', title: 'Đơn hàng đang được giao', body: 'Đơn SPD-2026-047 hiện đang di chuyển đến điểm giao.', time: '20 phút trước', unread: true },
  { id: 3, icon: '🎟️', color: 'bg-amber-50', title: 'Voucher mới dành cho bạn', body: 'SPEED20K — Giảm 20K cho mọi đơn hàng. HSD 30/09.', time: '1 giờ trước', unread: false },
  { id: 4, icon: '✅', color: 'bg-green-50', title: 'Giao hàng thành công', body: 'Đơn SPD-2026-044 đã được giao. Đánh giá tài xế ngay!', time: 'Hôm qua', unread: false },
  { id: 5, icon: '💰', color: 'bg-purple-50', title: 'Hoàn tiền ví Speed', body: '+15,000₫ đã được hoàn vào ví từ đơn SPD-2026-041.', time: 'Hôm qua', unread: false },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>(INIT);
  const [filter, setFilter] = useState('ALL');

  const unreadCount = items.filter((n) => n.unread).length;
  const filtered = items.filter((n) => filter === 'ALL' || (filter === 'UNREAD' && n.unread));

  const markAllRead = () => setItems((ns) => ns.map((n) => ({ ...n, unread: false })));
  const markRead = (id: number) => setItems((ns) => ns.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const remove = (id: number) => setItems((ns) => ns.filter((n) => n.id !== id));

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Thông báo</h1>
          <p className="text-gray-500 text-sm mt-0.5">{unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc hết'}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
          >
            ✓ Đọc tất cả
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {['ALL', 'UNREAD'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              filter === f ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'ALL' ? 'Tất cả' : `Chưa đọc (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-200 flex items-start gap-4 cursor-pointer ${
              n.unread ? 'border-red-100' : 'border-gray-100 opacity-75'
            }`}
          >
            <div className={`w-11 h-11 ${n.color} rounded-xl flex items-center justify-center text-xl shrink-0`}>{n.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-sm ${n.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{n.title}</span>
                {n.unread && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{n.body}</p>
              <span className="text-xs text-gray-300 mt-1 block">{n.time}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); remove(n.id); }}
              className="text-gray-300 hover:text-red-500 transition-colors text-sm shrink-0 p-1"
              title="Xóa"
            >
              ✕
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-gray-400 font-medium">Không có thông báo nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
