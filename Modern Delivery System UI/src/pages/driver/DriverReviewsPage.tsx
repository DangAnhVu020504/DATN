const REVIEWS = [
  { id: 1, customer: 'Nguyễn Văn An', stars: 5, comment: 'Tài xế giao nhanh, thái độ tốt, đóng gói hàng cẩn thận!', date: '09/09/2026', order: 'SPD-044' },
  { id: 2, customer: 'Trần Thị B', stars: 5, comment: 'Rất hài lòng, giao đúng giờ và chuyên nghiệp.', date: '08/09/2026', order: 'SPD-043' },
  { id: 3, customer: 'Lê Văn C', stars: 4, comment: 'Giao hàng tốt, nhưng đến hơi trễ một chút.', date: '07/09/2026', order: 'SPD-042' },
  { id: 4, customer: 'Phạm Thị D', stars: 5, comment: 'Tuyệt vời, sẽ tiếp tục sử dụng dịch vụ.', date: '06/09/2026', order: 'SPD-041' },
  { id: 5, customer: 'Hoàng Minh E', stars: 3, comment: 'Bình thường, không có gì đặc biệt.', date: '05/09/2026', order: 'SPD-040' },
];

const DIST = [
  { stars: 5, count: 89 },
  { stars: 4, count: 32 },
  { stars: 3, count: 12 },
  { stars: 2, count: 4 },
  { stars: 1, count: 5 },
];
const total = DIST.reduce((s, d) => s + d.count, 0);

export default function DriverReviewsPage() {
  const avg = (DIST.reduce((s, d) => s + d.stars * d.count, 0) / total).toFixed(1);

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Đánh giá từ khách hàng</h1>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito' }}>{avg}</div>
            <div className="flex gap-0.5 justify-center mb-1">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-xl ${s <= Math.round(parseFloat(avg)) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
              ))}
            </div>
            <div className="text-xs text-gray-400">{total} đánh giá</div>
          </div>
          <div className="flex-1 space-y-2">
            {DIST.map(d => {
              const pct = Math.round((d.count / total) * 100);
              return (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4">{d.stars}</span>
                  <span className="text-amber-400 text-xs">★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-7">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {REVIEWS.map(r => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                  {r.customer.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{r.customer}</div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-sm ${s <= r.stars ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">{r.date}</div>
                <div className="text-xs text-gray-400 font-mono">{r.order}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-5">
        {[1,2,3].map(p => (
          <button key={p} className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
            p === 1 ? 'bg-red-gradient text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'}`}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
