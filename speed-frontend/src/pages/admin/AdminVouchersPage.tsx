import { useCallback, useEffect, useState } from 'react';
import { voucherService } from '@/services/voucherService';
import type { VoucherResponse } from '@/types';

const EMPTY = { code: '', desc: '', type: 'FIXED_AMOUNT' as string, value: '', maxDisc: '', minOrder: '', usageLimit: '', start: '', end: '' };

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = useCallback(() => {
    setLoading(true);
    voucherService
      .getAllVouchers()
      .then((res) => setVouchers(res.data.data ?? []))
      .catch(() => setError('Không thể tải danh sách voucher'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    setError('');
    try {
      const res = await voucherService.toggleVoucher(id);
      setVouchers((vs) => vs.map((v) => (v.id === id ? res.data.data : v)));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể cập nhật voucher');
    } finally {
      setTogglingId(null);
    }
  };

  const save = async () => {
    setFormError('');
    if (!form.code.trim() || !form.value || !form.start || !form.end) {
      setFormError('Vui lòng nhập đầy đủ mã, giá trị giảm và thời gian hiệu lực');
      return;
    }
    setSaving(true);
    try {
      await voucherService.createVoucher({
        code: form.code.trim().toUpperCase(),
        description: form.desc || undefined,
        discountType: form.type,
        discountValue: Number(form.value),
        maxDiscount: form.maxDisc ? Number(form.maxDisc) : undefined,
        minOrderValue: form.minOrder ? Number(form.minOrder) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        startDate: `${form.start}T00:00:00`,
        endDate: `${form.end}T23:59:59`,
      });
      setModal(false);
      setForm(EMPTY);
      load();
    } catch (e: any) {
      setFormError(e.response?.data?.message || 'Tạo voucher thất bại');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

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

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">⚠️ {error}</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-8 h-8 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Đang tải voucher...</p>
          </div>
        )}

        {!loading && vouchers.map((v) => {
          const pct = v.usageLimit > 0 ? Math.round((v.usedCount / v.usageLimit) * 100) : 0;
          const isPercentage = v.discountType === 'PERCENTAGE';
          return (
            <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl shrink-0">🎟️</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 font-mono text-base">{v.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {v.isActive ? '● Hoạt động' : '○ Ngừng'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{v.description ?? '—'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-red-600" style={{ fontFamily: 'Nunito' }}>
                    {isPercentage ? `-${v.discountValue}%` : `-${(v.discountValue / 1000).toFixed(0)}K₫`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3 text-xs">
                <div><span className="text-gray-400">Loại: </span><b className="text-gray-700">{isPercentage ? 'Phần trăm' : 'Số tiền'}</b></div>
                <div><span className="text-gray-400">Đơn tối thiểu: </span><b className="text-gray-700">{((v.minOrderValue ?? 0) / 1000).toFixed(0)}K₫</b></div>
                <div><span className="text-gray-400">HSD: </span><b className="text-gray-700">{formatDate(v.startDate)} → {formatDate(v.endDate)}</b></div>
                <div><span className="text-gray-400">Giảm tối đa: </span><b className="text-gray-700">{v.maxDiscount ? `${(v.maxDiscount / 1000).toFixed(0)}K₫` : '—'}</b></div>
              </div>

              {/* Usage progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Đã dùng: {v.usedCount}/{v.usageLimit}</span>
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
                  onClick={() => handleToggle(v.id)}
                  disabled={togglingId === v.id}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {togglingId === v.id ? '...' : v.isActive ? '🔕 Tắt' : '🔔 Bật'}
                </button>
              </div>
            </div>
          );
        })}

        {!loading && vouchers.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">🎟️</div>
            <p className="text-gray-400 font-medium">Chưa có voucher nào</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-900 text-xl mb-5" style={{ fontFamily: 'Nunito' }}>Tạo voucher mới</h3>
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">⚠️ {formError}</div>
            )}
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
              <button onClick={() => { setModal(false); setFormError(''); }} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang lưu...</> : '💾 Lưu voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}