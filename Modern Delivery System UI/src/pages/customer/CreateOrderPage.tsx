import { useState } from 'react';
import { useNavigate } from 'react-router';

type Step = 1 | 2 | 3;

const initialForm = {
  pickupAddress: '', senderName: '', senderPhone: '',
  deliveryAddress: '', receiverName: '', receiverPhone: '',
  description: '', weight: '', note: '',
  deliveryType: 'STANDARD' as 'STANDARD' | 'EXPRESS',
  payment: 'CASH' as 'CASH' | 'WALLET' | 'BANK',
  voucherCode: '',
};

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState(initialForm);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const price = form.deliveryType === 'EXPRESS' ? '55,000₫' : '35,000₫';

  const steps = [
    { n: 1, label: 'Địa chỉ' },
    { n: 2, label: 'Gói hàng' },
    { n: 3, label: 'Xác nhận' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito' }}>Tạo đơn hàng mới</h1>
        <p className="text-gray-500 text-sm">Điền thông tin để tạo đơn giao hàng</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-red-gradient text-white shadow-lg shadow-red-200' : 'bg-gray-200 text-gray-400'
              }`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={`text-xs mt-1 font-medium ${step === s.n ? 'text-red-600' : 'text-gray-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all duration-300 ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <h3 className="font-bold text-red-700 text-sm mb-3 flex items-center gap-2">📍 Thông tin lấy hàng</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Địa chỉ lấy hàng</label>
                  <input value={form.pickupAddress} onChange={set('pickupAddress')} placeholder="123 Nguyễn Trãi, Quận 1, TP.HCM"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Tên người gửi</label>
                    <input value={form.senderName} onChange={set('senderName')} placeholder="Nguyễn Văn A"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">SĐT người gửi</label>
                    <input value={form.senderPhone} onChange={set('senderPhone')} placeholder="0901 234 567"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h3 className="font-bold text-blue-700 text-sm mb-3 flex items-center gap-2">🏠 Thông tin giao hàng</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Địa chỉ giao hàng</label>
                  <input value={form.deliveryAddress} onChange={set('deliveryAddress')} placeholder="456 Lê Lợi, Quận 3, TP.HCM"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Tên người nhận</label>
                    <input value={form.receiverName} onChange={set('receiverName')} placeholder="Trần Thị B"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">SĐT người nhận</label>
                    <input value={form.receiverPhone} onChange={set('receiverPhone')} placeholder="0912 345 678"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Mô tả hàng hóa</label>
                <input value={form.description} onChange={set('description')} placeholder="Quần áo, đồ điện tử..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Khối lượng (kg)</label>
                <input type="number" value={form.weight} onChange={set('weight')} placeholder="0.5"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Ghi chú cho tài xế</label>
              <textarea value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Gọi trước khi đến, để ở bảo vệ..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 resize-none h-20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Loại dịch vụ</label>
              <div className="grid grid-cols-2 gap-3">
                {([['STANDARD', '🚗 Tiêu chuẩn', '2-3 giờ', '35,000₫'], ['EXPRESS', '⚡ Hỏa tốc', '30-60 phút', '55,000₫']] as const).map(([val, label, time, p]) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, deliveryType: val }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      form.deliveryType === val ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="font-bold text-sm text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{time}</div>
                    <div className="text-sm font-bold text-red-600 mt-1">{p}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Thanh toán</label>
              <div className="flex gap-2">
                {([['CASH', '💵 Tiền mặt'], ['WALLET', '👛 Ví'], ['BANK', '🏦 Chuyển khoản']] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, payment: val }))}
                    className={`flex-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 ${
                      form.payment === val ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Mã giảm giá</label>
              <div className="flex gap-2">
                <input value={form.voucherCode} onChange={set('voucherCode')} placeholder="SPEED20K"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 font-mono" />
                <button className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">Áp dụng</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-black text-gray-900 text-lg" style={{ fontFamily: 'Nunito' }}>Xác nhận đơn hàng</h3>
            <div className="space-y-3">
              {[
                { label: '📍 Lấy hàng', value: form.pickupAddress || '123 Nguyễn Trãi, Quận 1' },
                { label: '🏠 Giao đến', value: form.deliveryAddress || '456 Lê Lợi, Quận 3' },
                { label: '👤 Người gửi', value: `${form.senderName || 'Nguyễn Văn An'} – ${form.senderPhone || '0901 234 567'}` },
                { label: '👤 Người nhận', value: `${form.receiverName || 'Trần Thị B'} – ${form.receiverPhone || '0912 345 678'}` },
                { label: '📦 Hàng hóa', value: form.description || 'Quần áo' },
                { label: '⚖️ Khối lượng', value: `${form.weight || '0.5'} kg` },
                { label: '🚗 Dịch vụ', value: form.deliveryType === 'EXPRESS' ? '⚡ Hỏa tốc' : '🚗 Tiêu chuẩn' },
                { label: '💳 Thanh toán', value: form.payment === 'CASH' ? '💵 Tiền mặt' : form.payment === 'WALLET' ? '👛 Ví' : '🏦 Chuyển khoản' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-start py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500 shrink-0 w-36">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-red-gradient rounded-xl p-4 flex justify-between items-center">
              <span className="text-white font-semibold">Tổng tiền dự kiến</span>
              <span className="text-white text-2xl font-black" style={{ fontFamily: 'Nunito' }}>{price}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as Step)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              ← Quay lại
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep((s) => (s + 1) as Step)}
              className="px-6 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200">
              Tiếp tục →
            </button>
          ) : (
            <button onClick={() => { alert('Đặt đơn thành công! (Demo)'); navigate('/'); }}
              className="px-6 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200">
              🚀 Đặt đơn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
