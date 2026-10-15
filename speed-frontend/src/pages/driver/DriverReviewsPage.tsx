import { useState } from 'react';

const REVIEWS = [
  { id: 1, customer: 'Nguyễn Văn An', rating: 5, comment: 'Giao hàng nhanh, thái độ lịch sự. Rất hài lòng!', date: '09/09/2026', order: 'SPD-2026-047' },
  { id: 2, customer: 'Trần Thị B', rating: 5, comment: 'Tài xế chu đáo, hàng được giao nguyên vẹn.', date: '08/09/2026', order: 'SPD-2026-044' },
  { id: 3, customer: 'Lê Văn C', rating: 4, comment: 'Giao đúng hẹn, nhưng gọi điện hơi muộn.', date: '08/09/2026', order: 'SPD-2026-043' },
  { id: 4, customer: 'Phạm Thị D', rating: 5, comment: 'Nhiệt tình, hỗ trợ bốc hàng nhẹ nhàng. 10 điểm!', date: '07/09/2026', order: 'SPD-2026-041' },
  { id: 5, customer: 'Hoàng Minh E', rating: 3, comment: 'Đơn giao hơi trễ so với dự kiến.', date: '06/09/2026', order: 'SPD-2026-039' },
];

const DISTRIBUTION = [
  { stars: 5, count: 98, pct: 69 },
  { stars: 4, count: 30, pct: 21 },
  { stars: 3, count: 10, pct: 7 },
  { stars: 2, count: 3, pct: 2 },
  { stars: 1, count: 1, pct: 1 },
];

export default function DriverReviewsPage() {
  const [filter, setFilter] = useState('ALL');

  const filtered = REVIEWS.filter((r) => filter === 'ALL' || r.rating === Number(filter));

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Đánh giá của khách hàng</h1>
        <p className="text-gray-500 text-sm mt-0.5">142 đánh giá</p>
      </div>

      {/* Rating summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-center gap-8">
          <div className="text-center shrink-0">
            <div className="text-5xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito' }}>4.8</div>
            <div className="text-amber-400 text-lg mb-1">★★★★★</div>
            <div className="text-xs text-gray-400">142 đánh giá</div>
          </div>
          <div className="flex-1 space-y-2">
            {DISTRIBUTION.map((d) => (
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
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-red-gradient rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {r.customer.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">{r.customer}</span>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-amber-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-gray-400 font-mono">{r.order}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">{r.comment}</p>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-gray-400 font-medium">Chưa có đánh giá nào ở mục này</p>
          </div>
        )}
      </div>
    </div>
  );
}
