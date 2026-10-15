import { useState } from 'react';
import { Link, useParams } from 'react-router';

const STEPS = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKING_UP', 'IN_TRANSIT', 'DELIVERED'];
const STEP_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý', CONFIRMED: 'Xác nhận', ASSIGNED: 'Gán tài xế',
  PICKING_UP: 'Đang lấy hàng', IN_TRANSIT: 'Đang giao', DELIVERED: 'Hoàn thành',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const currentStep = 'IN_TRANSIT';
  const currentIdx = STEPS.indexOf(currentStep);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [rated, setRated] = useState(false);

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">←</Link>
        <div>
          <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Đơn SPD-2026-00{id}</h1>
          <span className="text-xs px-2 py-1 rounded-full font-semibold badge-transit">Đang giao</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Trạng thái đơn hàng</h3>
        <div className="space-y-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < currentIdx ? 'bg-green-500 text-white' : i === currentIdx ? 'bg-red-gradient text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`absolute ml-4 mt-8 w-0.5 h-3 ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />}
              <div>
                <span className={`text-sm font-semibold ${i === currentIdx ? 'text-red-600' : i < currentIdx ? 'text-green-600' : 'text-gray-400'}`}>
                  {STEP_LABELS[s]}
                </span>
                {i === currentIdx && <span className="text-xs text-gray-400 ml-2">14:32 hôm nay</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">📍 Thông tin địa chỉ</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-sm shrink-0">🏭</div>
              <div>
                <div className="text-xs text-gray-400">Lấy hàng từ</div>
                <div className="text-sm font-semibold text-gray-800">123 Nguyễn Trãi, Quận 1</div>
                <div className="text-xs text-gray-500">Nguyễn Văn An – 0901 234 567</div>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-200 my-2" />
            <div className="flex gap-3">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm shrink-0">🏠</div>
              <div>
                <div className="text-xs text-gray-400">Giao đến</div>
                <div className="text-sm font-semibold text-gray-800">456 Lê Lợi, Quận 3</div>
                <div className="text-xs text-gray-500">Trần Thị B – 0912 345 678</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 text-xs mb-3">📦 Gói hàng</h3>
            <div className="space-y-1">
              <div className="text-xs text-gray-500">Mô tả: <span className="text-gray-700 font-medium">Quần áo</span></div>
              <div className="text-xs text-gray-500">Khối lượng: <span className="text-gray-700 font-medium">0.5 kg</span></div>
              <div className="text-xs text-gray-500">Dịch vụ: <span className="text-red-600 font-semibold">⚡ Hỏa tốc</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 text-xs mb-3">🚗 Tài xế</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">K</div>
              <div>
                <div className="text-xs font-semibold text-gray-800">Trần Minh Khoa</div>
                <div className="text-xs text-gray-400">⭐ 4.8</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">0908 765 432</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-3">💳 Chi tiết giá</h3>
          <div className="space-y-2">
            {[['Phí giao hàng', '55,000₫'], ['Giảm giá (SPEED20K)', '-20,000₫'], ['Tổng thanh toán', '35,000₫']].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className={`font-semibold ${k.includes('Tổng') ? 'text-red-600 text-base' : k.includes('Giảm') ? 'text-green-600' : 'text-gray-800'}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rating (show when delivered) */}
      {!rated ? (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-4">
          <h3 className="font-bold text-amber-800 text-sm mb-3">⭐ Đánh giá tài xế</h3>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)}
                className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'opacity-100' : 'opacity-30'}`}>⭐</button>
            ))}
          </div>
          <textarea value={review} onChange={e => setReview(e.target.value)}
            placeholder="Nhận xét về dịch vụ..."
            className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm bg-white resize-none h-16 mb-3" />
          <button onClick={() => setRated(true)} disabled={!rating}
            className="bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-40">
            Gửi đánh giá
          </button>
        </div>
      ) : (
        <div className="bg-green-50 rounded-xl p-4 mb-4 text-center border border-green-200">
          <span className="text-green-700 font-semibold text-sm">✅ Cảm ơn bạn đã đánh giá!</span>
        </div>
      )}

      {/* Cancel button */}
      {!cancelOpen ? (
        <button onClick={() => setCancelOpen(true)}
          className="w-full py-3 border-2 border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
          🚫 Hủy đơn hàng
        </button>
      ) : (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
          <h3 className="font-bold text-red-700 text-sm mb-3">Lý do hủy đơn</h3>
          <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
            placeholder="Nhập lý do hủy..."
            className="w-full px-3 py-2.5 border border-red-200 rounded-xl text-sm bg-white mb-3" />
          <div className="flex gap-2">
            <button onClick={() => setCancelOpen(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Hủy bỏ</button>
            <button onClick={() => { alert('Đã hủy đơn! (Demo)'); setCancelOpen(false); }}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">Xác nhận hủy</button>
          </div>
        </div>
      )}
    </div>
  );
}
