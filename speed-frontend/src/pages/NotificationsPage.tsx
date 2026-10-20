import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { notificationService } from '@/services/notificationService';
import type { NotificationResponse } from '@/types';

const TYPE_META: Record<string, { icon: string; color: string }> = {
  ORDER: { icon: '📦', color: 'bg-blue-50' },
  PROMOTION: { icon: '🎟️', color: 'bg-amber-50' },
  PAYMENT: { icon: '💰', color: 'bg-purple-50' },
  SYSTEM: { icon: '🔔', color: 'bg-gray-50' },
  CHAT: { icon: '💬', color: 'bg-green-50' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function NotificationsPage() {
  const userId = useSelector((s: RootState) => s.auth.user?.userId);
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    notificationService
      .getUserNotifications(userId, 0, 50)
      .then((res) => { if (!cancelled) setItems(res.data.data ?? []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const unreadCount = items.filter((n) => !n.isRead).length;
  const filtered = items.filter((n) => filter === 'ALL' || (filter === 'UNREAD' && !n.isRead));

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.isRead);
    setItems((ns) => ns.map((n) => ({ ...n, isRead: true })));
    await Promise.all(unread.map((n) => notificationService.markAsRead(n.id).catch(() => undefined)));
  };

  const markRead = (id: number) => {
    setItems((ns) => ns.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    notificationService.markAsRead(id).catch(() => undefined);
  };

  const remove = (id: number) => {
    setItems((ns) => ns.filter((n) => n.id !== id));
    notificationService.deleteNotification(id).catch(() => undefined);
  };

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
        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-8 h-8 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Đang tải thông báo...</p>
          </div>
        )}
        {!loading && filtered.map((n) => {
          const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
          return (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-200 flex items-start gap-4 cursor-pointer ${
              !n.isRead ? 'border-red-100' : 'border-gray-100 opacity-75'
            }`}
          >
            <div className={`w-11 h-11 ${meta.color} rounded-xl flex items-center justify-center text-xl shrink-0`}>{meta.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{n.title}</span>
                {!n.isRead && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
              <span className="text-xs text-gray-300 mt-1 block">{timeAgo(n.createdAt)}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); remove(n.id); }}
              className="text-gray-300 hover:text-red-500 transition-colors text-sm shrink-0 p-1"
              title="Xóa"
            >
              ✕
            </button>
          </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-gray-400 font-medium">Không có thông báo nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
