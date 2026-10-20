import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '@/services/orderService';
import { voucherService } from '@/services/voucherService';
import type { VoucherResponse } from '@/types';

interface PackageForm {
  pickupAddress: string;
  pickupContactName: string;
  pickupContactPhone: string;
  deliveryAddress: string;
  deliveryContactName: string
  deliveryContactPhone: string;
  packageDescription: string;
  packageWeight: string;
  packageNote: string;
  deliveryType: 'STANDARD' | 'EXPRESS' | 'SCHEDULED';
  scheduledTime: string;
  paymentMethod: 'CASH' | 'WALLET' | 'BANKING';
  voucherCode: string;
}

const EMPTY: PackageForm = {
  pickupAddress: '', pickupContactName: '', pickupContactPhone: '',
  deliveryAddress: '', deliveryContactName: '', deliveryContactPhone: '',
  packageDescription: '', packageWeight: '', packageNote: '',
  deliveryType: 'STANDARD', scheduledTime: '', paymentMethod: 'CASH', voucherCode: '',
};

const STEPS = ['Điểm nhận & giao', 'Gói hàng', 'Xác nhận'];

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PackageForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [voucher, setVoucher] = useState<VoucherResponse | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherChecking, setVoucherChecking] = useState(false);

  const set = (k: keyof PackageForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const basePrice = 15000;
  const weightCost = Number(form.packageWeight || 0) * 3000;
  const deliveryCost = form.deliveryType === 'EXPRESS' ? 20000 : form.deliveryType === 'SCHEDULED' ? 5000 : 0;
  const subtotal = basePrice + weightCost + deliveryCost;
  const discount = voucher
    ? voucher.discountType === 'PERCENTAGE'
      ? Math.min(Math.ceil((subtotal * voucher.discountValue) / 100), voucher.maxDiscount ?? Infinity)
      : voucher.discountValue
    : 0;
  const totalPrice = Math.max(subtotal - discount, 0);

  const canNext =
    step === 1 ? form.pickupAddress && form.deliveryAddress && form.pickupContactPhone && form.deliveryContactPhone
    : step === 2 ? form.packageDescription
    : true;

  const handleApplyVoucher = async () => {
    if (!form.voucherCode.trim()) return;
    setVoucherChecking(true);
    setVoucherError('');
    try {
      const res = await voucherService.validateVoucher(form.voucherCode.trim(), subtotal);
      setVoucher(res.data.data);
    } catch (e: any) {
      setVoucher(null);
      setVoucherError(e.response?.data?.message || 'Mã voucher không hợp lệ');
    } finally {
      setVoucherChecking(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await orderService.createOrder({
        pickupAddress: form.pickupAddress,
        pickupContactName: form.pickupContactName,
        pickupContactPhone: form.pickupContactPhone,
        deliveryAddress: form.deliveryAddress,
        deliveryContactName: form.deliveryContactName,
        deliveryContactPhone: form.deliveryContactPhone,
        packageDescription: form.packageDescription || undefined,
        packageWeight: form.packageWeight ? Number(form.packageWeight) : undefined,
        packageNote: form.packageNote || undefined,
        deliveryType: form.deliveryType,
        scheduledTime: form.scheduledTime || undefined,
        paymentMethod: form.paymentMethod,
        voucherCode: form.voucherCode.trim() || undefined,
      });
      navigate(`/orders/${res.data.data.id}`);
    } catch (e: any) {
      setSubmitError(e.response?.data?.message || 'Tạo đơn hàng thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200';

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => (step === 1 ? navigate('/orders') : setStep(step - 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">←</button>
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Tạo đơn hàng mới</h1>
          <p className="text-gray-500 text-sm mt-0.5">Bước {step}/3 — {STEPS[step - 1]}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step > n ? 'bg-green-500 text-white' : step === n ? 'bg-red-gradient text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > n ? '✓' : n}
</div>
                <span className={`text-xs mt-1.5 font-semibold whitespace-nowrap ${step >= n ? 'text-red-600' : 'text-gray-400'}`}>{label}</span>
              </div>
              {n < 3 && <div className={`flex-1 h-0.5 mx-2 mb-5 ${step > n ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Pickup */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">🟢</div>
                <h3 className="font-bold text-gray-900">Điểm lấy hàng</h3>
              </div>
              <div className="space-y-3">
                <input placeholder="Địa chỉ lấy hàng *" value={form.pickupAddress} onChange={set('pickupAddress')} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Tên người gửi *" value={form.pickupContactName} onChange={set('pickupContactName')} className={inputCls} />
                  <input placeholder="SĐT người gửi *" value={form.pickupContactPhone} onChange={set('pickupContactPhone')} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t border-dashed border-gray-200" />
              <span className="text-gray-300">⬇</span>
              <div className="flex-1 border-t border-dashed border-gray-200" />
            </div>

            {/* Delivery */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">🔴</div>
                <h3 className="font-bold text-gray-900">Điểm giao hàng</h3>
              </div>
              <div className="space-y-3">
                <input placeholder="Địa chỉ giao hàng *" required value={form.deliveryAddress} onChange={set('deliveryAddress')} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Tên người nhận *" value={form.deliveryContactName} onChange={set('deliveryContactName')} className={inputCls} />
                  <input placeholder="SĐT người nhận *" value={form.deliveryContactPhone} onChange={set('deliveryContactPhone')} className={inputCls} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả gói hàng *</label>
              <input placeholder="VD: Tài liệu, quần áo, đồ ăn..." value={form.packageDescription} onChange={set('packageDescription')} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Khối lượng (kg)</label>
                <input type="number" min="0" placeholder="0" value={form.packageWeight} onChange={set('packageWeight')} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại giao</label>
                <select value={form.deliveryType} onChange={set('deliveryType')} className={inputCls}>
                  <option value="STANDARD">Tiêu chuẩn (2-4h)</option>
                  <option value="EXPRESS">Hỏa tốc (60 phút)</option>
                  <option value="SCHEDULED">Đặt lịch</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú cho tài xế</label>
              <textarea rows={2} placeholder="VD: Gọi trước khi đến..." value={form.packageNote} onChange={set('packageNote')} className={inputCls} />
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Lấy hàng</span><span className="font-medium text-gray-800">{form.pickupAddress || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Giao hàng</span><span className="font-medium text-gray-800">{form.deliveryAddress || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Gói hàng</span><span className="font-medium text-gray-800">{form.packageDescription || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Loại giao</span><span className="font-medium text-gray-800">{form.deliveryType}</span></div>
            </div>

            {/* Payment */}
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-2">Phương thức thanh toán</h4>
              <div className="grid grid-cols-3 gap-3">
                {([
                  ['CASH', '💵 Tiền mặt'],
                  ['WALLET', '👛 Ví Speed'],
                  ['BANKING', '🏦 Chuyển khoản'],
                ] as [PackageForm['paymentMethod'], string][]).map(([pm, label]) => (
                  <button key={pm} type="button" onClick={() => setForm((f) => ({ ...f, paymentMethod: pm }))}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      form.paymentMethod === pm ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:border-red-200'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voucher */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã voucher</label>
              <div className="flex gap-2">
                <input placeholder="Nhập mã (tùy chọn)" value={form.voucherCode}
                  onChange={(e) => { set('voucherCode')(e); setVoucher(null); setVoucherError(''); }}
                  className={inputCls} />
                <button type="button" onClick={handleApplyVoucher} disabled={voucherChecking || !form.voucherCode.trim()}
                  className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                  {voucherChecking ? '...' : 'Áp dụng'}
                </button>
              </div>
              {voucherError && <p className="text-xs text-red-500 mt-1.5">⚠️ {voucherError}</p>}
              {voucher && (
                <p className="text-xs text-green-600 mt-1.5">
                  ✅ Áp dụng thành công: giảm {discount.toLocaleString('vi-VN')}₫
                </p>
              )}
            </div>

            {/* Price */}
            <div className="bg-red-gradient-soft rounded-2xl p-5 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Giá cơ bản</span><span>{basePrice.toLocaleString('vi-VN')}₫</span></div>
              <div className="flex justify-between text-gray-600"><span>Phí khối lượng</span><span>{weightCost.toLocaleString('vi-VN')}₫</span></div>
              <div className="flex justify-between text-gray-600"><span>Loại giao</span><span>{deliveryCost.toLocaleString('vi-VN')}₫</span></div>
              {voucher && discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Voucher ({voucher.code})</span><span>-{discount.toLocaleString('vi-VN')}₫</span></div>
              )}
              <div className="border-t border-red-100 pt-2 flex justify-between font-black text-lg text-red-600" style={{ fontFamily: 'Nunito' }}>
                <span>Tổng cộng</span><span>{totalPrice.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                ⚠️ {submitError}
              </div>
            )}
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 mt-7">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              ← Quay lại
</button>
          )}
          {step < 3 ? (
            <button onClick={() => canNext && setStep(step + 1)} disabled={!canNext}
              className="flex-1 py-3 bg-red-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              Tiếp tục →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3 bg-red-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2">
              {submitting ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tạo...</> : '🚀 Tạo đơn hàng'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
