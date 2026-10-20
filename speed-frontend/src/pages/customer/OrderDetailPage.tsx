import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { orderService } from '@/services/orderService';
import { reviewService } from '@/services/reviewService';
import type { OrderResponse, OrderHistoryResponse, ReviewResponse } from '@/types';

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'Chờ xử lý', cls: 'badge-pending' },
  CONFIRMED:  { label: 'Xác nhận',  cls: 'badge-confirmed' },
  ASSIGNED:   { label: 'Gán tài xế', cls: 'badge-assigned' },
  PICKING_UP: { label: 'Đang lấy hàng', cls: 'badge-picking' },
  IN_TRANSIT: { label: 'Đang giao',  cls: 'badge-transit' },
  DELIVERED:  { label: 'Hoàn thành', cls: 'badge-delivered' },
  CANCELLED:  { label: 'Đã hủy',     cls: 'badge-cancelled' },
};

const TIMELINE = [
  { status: 'PENDING',    label: 'Đơn đã được tạo',      icon: '📝' },
  { status: 'CONFIRMED',  label: 'Xác nhận đơn hàng',    icon: '✅' },
  { status: 'PICKING_UP', label: 'Tài xế đang lấy hàng', icon: '🟢' },
  { status: 'IN_TRANSIT', label: 'Đang giao hàng',       icon: '🚗' },
  { status: 'DELIVERED',  label: 'Giao hàng thành công', icon: '🏁' },
];

const FLOW_ORDER = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKING_UP', 'IN_TRANSIT', 'DELIVERED'];

const formatPrice = (v: number | null | undefined) => v != null ? new Intl.NumberFormat('vi-VN').format(v) + '₫' : '—';
const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

export default function OrderDetailPage() {
  const { id } = useParams();
  const customerId = useSelector((s: RootState) => s.auth.user?.customerId);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<OrderHistoryResponse[]>([]);
  const [existingReview, setExistingReview] = useState<ReviewResponse | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    orderService.getOrderById(Number(id))
      .then((res) => {
        setOrder(res.data.data);
        setError(null);
        // Lấy lịch sử trạng thái thật + review đã có (nếu đơn đã giao)
        orderService.getOrderHistory(Number(id))
          .then((h) => setHistory(h.data.data ?? []))
          .catch(() => setHistory([]));
        if (res.data.data?.status === 'DELIVERED') {
          reviewService.getOrderReview(Number(id))
            .then((r) => setExistingReview(r.data.data))
            .catch(() => setExistingReview(null));
        }
      })
      .catch((e) => setError(e.response?.data?.message || 'Không thể tải đơn hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-gray-500 font-medium mb-4">{error || 'Không tìm thấy đơn hàng'}</p>
        <Link to="/orders" className="text-sm font-bold text-red-600 hover:text-red-700">← Về danh sách đơn</Link>
      </div>
    );
  }

  const s = statusMap[order.status];
  const timelineIdx = order.status === 'CANCELLED' ? -1 : Math.max(0, FLOW_ORDER.indexOf(order.status) >= 0 ? FLOW_ORDER.indexOf(order.status) : 4);

  const doCancel = async () => {
    if (!id || !cancelReason.trim()) return;
    setSubmitting(true);
    try {
      await orderService.cancelOrder(Number(id), cancelReason.trim());
      setCancelModal(false);
      setCancelReason('');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Hủy đơn thất bại');
      setCancelModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const doReview = async () => {
    if (!customerId || !id) return;
    setSubmitting(true);
    try {
      const res = await reviewService.createReview(customerId, Number(id), rating, comment || undefined);
      setExistingReview(res.data.data);
      setReviewModal(false);
      setComment('');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gửi đánh giá thất bại');
      setReviewModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">←</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 font-mono" style={{ fontFamily: 'Nunito' }}>{order.orderCode}</h1>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${s?.cls}`}>{s?.label || order.status}</span>
        </div>
      </div>

      {/* Timeline từ lịch sử thật (nếu có); fallback hiển thị tĩnh theo trạng thái */}
      {history.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h2 className="font-black text-gray-900 mb-5" style={{ fontFamily: 'Nunito' }}>Tiến trình đơn hàng</h2>
          <div className="space-y-0">
            {[...history].reverse().map((h, i) => {
              const meta = statusMap[h.status];
              const icon = TIMELINE.find((t) => t.status === h.status)?.icon
                ?? (h.status === 'ASSIGNED' ? '🛵' : h.status === 'CANCELLED' ? '🚫' : '📍');
              const isLast = i < history.length - 1;
              return (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      h.status === 'CANCELLED' ? 'bg-red-100 text-red-500' : 'bg-red-gradient text-white shadow-md shadow-red-100'
                    }`}>{icon}</div>
                    {isLast && <div className="w-0.5 flex-1 min-h-8 bg-red-200" />}
                  </div>
                  <div className="pb-5">
                    <div className="text-sm font-semibold text-gray-900">{meta?.label || h.status}</div>
                    {h.note && <div className="text-xs text-gray-500 mt-0.5">{h.note}</div>}
                    <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(h.createdAt) ?? ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h2 className="font-black text-gray-900 mb-5" style={{ fontFamily: 'Nunito' }}>Tiến trình đơn hàng</h2>
          <div className="space-y-0">
            {TIMELINE.map((t, i) => {
              const done = i <= timelineIdx;
              const isLast = i < TIMELINE.length - 1;
              const time = t.status === 'DELIVERED' ? formatDateTime(order.deliveredAt) : formatDateTime(order.createdAt);
              return (
                <div key={t.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 transition-all duration-300 ${
                      done ? 'bg-red-gradient text-white shadow-md shadow-red-100' : 'bg-gray-100 text-gray-300'
                    }`}>{done ? t.icon : '○'}</div>
                    {isLast && <div className={`w-0.5 flex-1 min-h-8 ${done ? 'bg-red-200' : 'bg-gray-100'}`} />}
                  </div>
                  <div className="pb-5">
                    <div className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{t.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{done ? (time ?? 'Đã hoàn tất') : 'Chờ cập nhật...'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.status === 'CANCELLED' && (
        <div className="bg-red-50 rounded-2xl p-5 mb-5 text-center">
          <div className="text-4xl mb-2">🚫</div>
          <div className="font-black text-red-600" style={{ fontFamily: 'Nunito' }}>Đơn hàng đã bị hủy</div>
        </div>
      )}

      {/* Driver card */}
      {order.driverName && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-gradient rounded-full flex items-center justify-center text-white text-lg font-black shadow-lg shadow-red-100" style={{ fontFamily: 'Nunito' }}>
            {order.driverName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-sm">{order.driverName}</div>
            <div className="text-xs text-gray-400">Tài xế{order.driverPhone ? ` · ${order.driverPhone}` : ''}</div>
          </div>
          {order.driverPhone && (
            <a href={`tel:${order.driverPhone}`} className="w-9 h-9 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center">📞</a>
          )}
        </div>
      )}

      {/* Addresses */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5 space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">🟢</div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Điểm lấy hàng</div>
            <div className="text-sm text-gray-800">{order.pickupAddress}</div>
            <div className="text-xs text-gray-400">{order.pickupContactName} · {order.pickupContactPhone}</div>
          </div>
        </div>
        <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4" />
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">🔴</div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Điểm giao hàng</div>
            <div className="text-sm text-gray-800">{order.deliveryAddress}</div>
            <div className="text-xs text-gray-400">{order.deliveryContactName} · {order.deliveryContactPhone}</div>
          </div>
        </div>
      </div>

      {/* Package + price breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Thông tin gói hàng</h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
          <div><span className="text-gray-400">Mô tả: </span><b className="text-gray-800">{order.packageDescription || '—'}</b></div>
          <div><span className="text-gray-400">Khối lượng: </span><b className="text-gray-800">{order.packageWeight ? `${order.packageWeight} kg` : '—'}</b></div>
          <div><span className="text-gray-400">Loại giao: </span><b className="text-gray-800">{order.deliveryType === 'EXPRESS' ? 'Hỏa tốc' : order.deliveryType === 'SCHEDULED' ? 'Đặt lịch' : 'Tiêu chuẩn'}</b></div>
          <div><span className="text-gray-400">Khoảng cách: </span><b className="text-gray-800">{order.distanceKm ? `${order.distanceKm} km` : '—'}</b></div>
        </div>
        <div className="bg-red-gradient-soft rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600"><span>Giá cơ bản</span><span>{formatPrice(order.basePrice)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Phí khoảng cách</span><span>{formatPrice(order.distancePrice)}</span></div>
          {order.weightSurcharge != null && order.weightSurcharge > 0 && (
            <div className="flex justify-between text-gray-600"><span>Phụ phí khối lượng</span><span>{formatPrice(order.weightSurcharge)}</span></div>
          )}
          {order.discountAmount != null && order.discountAmount > 0 && (
            <div className="flex justify-between text-gray-600"><span>Voucher</span><span className="text-red-500">-{formatPrice(order.discountAmount)}</span></div>
          )}
          <div className="border-t border-red-100 pt-1.5 flex justify-between font-black text-red-600 text-base" style={{ fontFamily: 'Nunito' }}>
            <span>Tổng cộng</span><span>{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {['PENDING', 'CONFIRMED'].includes(order.status) && (
          <button onClick={() => setCancelModal(true)}
            className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
            🚫 Hủy đơn hàng
          </button>
        )}
        {order.status === 'DELIVERED' && !existingReview && (
          <button onClick={() => setReviewModal(true)}
            className="flex-1 py-3 bg-red-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200">
            ⭐ Đánh giá tài xế
          </button>
        )}
      </div>

      {/* Existing review */}
      {order.status === 'DELIVERED' && existingReview && (
        <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-sm">Đánh giá của bạn</h3>
            <span className="text-amber-400 text-sm">{'⭐'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</span>
          </div>
          {existingReview.comment && <p className="text-sm text-gray-600">"{existingReview.comment}"</p>}
          <p className="text-xs text-gray-400 mt-1">
            {existingReview.createdAt ? new Date(existingReview.createdAt).toLocaleString('vi-VN') : ''}
          </p>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="font-black text-gray-900 text-center text-lg mb-2" style={{ fontFamily: 'Nunito' }}>Xác nhận hủy đơn?</h3>
            <p className="text-sm text-gray-500 text-center mb-4">Hành động này không thể hoàn tác.</p>
            <textarea rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Lý do hủy đơn..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Đóng</button>
              <button onClick={doCancel} disabled={submitting || !cancelReason.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {submitting ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-black text-gray-900 text-center text-lg mb-4" style={{ fontFamily: 'Nunito' }}>Đánh giá tài xế</h3>
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className="text-3xl transition-transform duration-150 hover:scale-110">
                  {n <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Hủy</button>
              <button onClick={doReview} disabled={submitting}
                className="flex-1 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 disabled:opacity-60">
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <span className="text-xs text-gray-400">Mã tham chiếu: #{order.id}</span>
      </div>
    </div>
  );
}
