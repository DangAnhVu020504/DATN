import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { reviewService } from '@/services/reviewService';
import type { ReviewResponse } from '@/types';

export default function DriverReviewsPage() {
  const driverId = useSelector((s: RootState) => s.auth.user?.driverId);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;
    reviewService
      .getDriverReviews(driverId, 0, 100)
      .then((res) => { if (!cancelled) setReviews(res.data.data?.content ?? []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [driverId]);

  const filtered = reviews.filter((r) => filter === 'ALL' || r.rating === Number(filter));
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return { stars, count, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Đánh giá của khách hàng</h1>
        <p className="text-gray-500 text-sm mt-0.5">{reviews.length} đánh giá</p>
      </div>

      {/* Rating summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-center gap-8">
          <div className="text-center shrink-0">
            <div className="text-5xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito' }}>
              {avg ? avg.toFixed(1) : '—'}
            </div>
            <div className="text-amber-400 text-lg mb-1">
              {'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}
            </div>
            <div className="text-xs text-gray-400">{reviews.length} đánh giá</div>
          </div>
          <div className="flex-1 space-y-2">
            {distribution.map((d) => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-8">{d.stars} ★</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {['ALL', '5', '4', '3'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              filter === f ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f === 'ALL' ? 'Tất cả' : `${f} ★`}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-8 h-8 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Đang tải đánh giá...</p>
          </div>
        )}

        {!loading && filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-red-gradient rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {(r.customerName ?? 'K').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">{r.customerName}</span>
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-amber-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-gray-400 font-mono">#{r.orderId}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">{r.comment ?? 'Không có nhận xét'}</p>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-gray-400 font-medium">Chưa có đánh giá nào ở mục này</p>
          </div>
        )}
      </div>
    </div>
  );
}
