import { useState } from 'react';

const NOTIFICATIONS_INIT = [
  { id: 1, title: 'Đơn hàng được xác nhận', body: 'Đơn SPD-2026-047 của bạn đã được xác nhận và đang tìm tài xế.', time: '5 phút trước', read: false, icon: '📦' },
  { id: 2, title: 'Tài xế đã nhận đơn', body: 'Tài xế Trần Minh Khoa đang trên đường đến lấy hàng của bạn.', time: '12 phút trước', read: false, icon: '🚗' },
  { id: 3, title: 'Ưu đãi hôm nay!', body: 'Bạn có voucher SPEED20K giảm 20,000₫. Hãy sử dụng khi đặt đơn!', time: '1 giờ trước', read: false, icon: '🎟️' },
  { id: 4, title: 'Đơn hàng hoàn thành', body: 'Đơn SPD-2026-044 đã được giao thành công. Hãy đánh giá tài xế!', time: '3 giờ trước', read: true, icon: '✅' },
  { id: 5, title: 'Nhắc nhở thanh toán', body: 'Bạn có đơn hàng chờ thanh toán. Vui lòng kiểm tra.', time: '1 ngày trước', read: true, icon: '💳' },
  { id: 6, title: 'Cập nhật ứng dụng', body: 'Phiên bản mới đã có. Nâng cấp để trải nghiệm tốt hơn.', time: '2 ngày trước', read: true, icon: '🔄' },
];

export default function NotificationPage() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS_INIT);
  const unread = notifs.filter(n => !n.read).length;

  const markRead = (id: number) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })));

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
            Thông báo
            {unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{unread}</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{unread} chưa đọc</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 hover:bg-red-50 rounded-lg">
            ✓ Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifs.map(n => (
          <div key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
              !n.read
                ? 'bg-red-50 border-red-100 hover:bg-red-100'
                : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
              !n.read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-sm font-bold ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                  <span className="text-xs text-gray-400">{n.time}</span>
                </div>
              </div>
              <p className={`text-sm mt-0.5 leading-relaxed ${!n.read ? 'text-gray-700' : 'text-gray-400'}`}>{n.body}</p>
            </div>
          </div>
        ))}
      </div>

      {notifs.filter(n => !n.read).length === 0 && (
        <div className="mt-8 text-center text-gray-400">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-medium">Bạn đã đọc hết tất cả thông báo!</p>
        </div>
      )}

      <div className="flex justify-center gap-2 mt-6">
        {[1, 2].map(p => (
          <button key={p} className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
            p === 1 ? 'bg-red-gradient text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'}`}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
