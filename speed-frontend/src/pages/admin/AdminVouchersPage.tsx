import { useState } from 'react';

interface Voucher {
  id: number;
  code: string;
  desc: string;
  type: 'FIXED_AMOUNT' | 'PERCENTAGE';
  value: number;
  maxDisc: number;
  minOrder: number;
  usageLimit: number;
  used: number;
  start: string;
  end: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const VOUCHERS_INIT: Voucher[] = [
  { id: 1, code: 'SPEED20K', desc: 'Giảm 20K đơn từ 50K', type: 'FIXED_AMOUNT', value: 20000, maxDisc: 20000, minOrder: 50000, usageLimit: 100, used: 45, start: '01/09/2026', end: '30/09/2026', status: 'ACTIVE' },
  { id: 2, code: 'FIRST15', desc: 'Giảm 15% đơn đầu tiên', type: 'PERCENTAGE', value: 15, maxDisc: 30000, minOrder: 30000, usageLimit: 200, used: 88, start: '01/09/2026', end: '31/12/2026', status: 'ACTIVE' },
  { id: 3, code: 'VIP50K', desc: 'Giảm 50K cho VIP', type: 'FIXED_AMOUNT', value: 50000, maxDisc: 50000, minOrder: 150000, usageLimit: 50, used: 12, start: '01/09/2026', end: '15/10/2026', status: 'ACTIVE' },
  { id: 4, code: 'SUMMER25', desc: 'Hè 2026: Giảm 25%', type: 'PERCENTAGE', value: 25, maxDisc: 40000, minOrder: 0, usageLimit: 500, used: 500, start: '01/06/2026', end: '31/08/2026', status: 'INACTIVE' },
];

const EMPTY = { code: '', desc: '', type: 'FIXED_AMOUNT' as const, value: '', maxDisc: '', minOrder: '', usageLimit: '', start: '', end: '' };

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>(VOUCHERS_INIT);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    setVouchers((vs) => [
      ...vs,
      {
        id: Date.now(),
        ...form,
        value: Number(form.value) || 0,
        maxDisc: Number(form.maxDisc) || 0,
        minOrder: Number(form.minOrder) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        used: 0,
        status: 'ACTIVE' as const,
      },
    ]);
    setModal(false);
    setForm(EMPTY);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Quản lý Voucher</h1>
          <p className="text-gray-500 text-sm mt-0.5">{vouchers.length} voucher</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-red-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 flex items-center gap-2"
        >
          ➕ Tạo voucher
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {vouchers.map((v) => {
          const pct = v.usageLimit > 0 ? Math.round((v.used / v.usageLimit) * 100) : 0;
          return (
            <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl shrink-0">🎟️</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 font-mono text-base">{v.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        v.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {v.status === 'ACTIVE' ? '● Hoạt động' : '○ Ngừng'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{v.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-red-600" style={{ fontFamily: 'Nunito' }}>
                    {v.type === 'PERCENTAGE' ? `-${v.value}%` : `-${(v.value / 1000).toFixed(0)}K₫`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3 text-xs">
                <div><span className="text-gray-400">Loại: </span><b className="text-gray-700">{v.type === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền'}</b></div>
                <div><span className="text-gray-400">Đơn tối thiểu: </span><b className="text-gray-700">{(v.minOrder / 1000).toFixed(0)}K₫</b></div>
                <div><span className="text-gray-400">HSD: </span><b className="text-gray-700">{v.start} → {v.end}</b></div>
                <div><span className="text-gray-400">Giảm tối đa: </span><b className="text-gray-700">{(v.maxDisc / 1000).toFixed(0)}K₫</b></div>
              </div>

              {/* Usage progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Đã dùng: {v.used}/{v.usageLimit}</span>
                  <span className={pct >= 100 ? 'text-red-500 font-semibold' : ''}>{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setVouchers((vs) => vs.map((x) => (x.id === v.id ? { ...x, status: x.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : x)))}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {v.status === 'ACTIVE' ? '🔕 Tắt' : '🔔 Bật'}
                </button>
                <button
                  onClick={() => setVouchers((vs) => vs.filter((x) => x.id !== v.id))}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-900 text-xl mb-5" style={{ fontFamily: 'Nunito' }}>Tạo voucher mới</h3>
            <div className="grid grid-cols-2 gap-4">
              {([
                ['Mã voucher', 'code', 'text'],
                ['Mô tả', 'desc', 'text'],
                ['Giá trị giảm', 'value', 'number'],
                ['Giảm tối đa (₫)', 'maxDisc', 'number'],
                ['Đơn tối thiểu (₫)', 'minOrder', 'number'],
                ['Giới hạn sử dụng', 'usageLimit', 'number'],
                ['Ngày bắt đầu', 'start', 'date'],
                ['Ngày kết thúc', 'end', 'date'],
              ] as [string, keyof typeof form, string][]).map(([label, key, type]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={set(key)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Loại giảm giá</label>
                <select
                  value={form.type}
                  onChange={set('type')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
                >
                  <option value="FIXED_AMOUNT">Số tiền cố định</option>
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={save} className="flex-1 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90">
                💾 Lưu voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
