import { useEffect, useState } from 'react';
import { voucherService } from '@/services/voucherService';
import type { VoucherResponse } from '@/types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function VoucherListPage() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    voucherService.getActiveVouchers()
      .then((res) => setVouchers(res.data.data))
      .catch(() => setResult({ ok: false, msg: 'Không thể tải danh sách voucher' }))
      .finally(() => setLoading(false));
  }, []);

  const checkCode = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try {
      // Nếu mã trùng voucher trong danh sách, dùng minOrderValue của chính nó
      // (tránh báo "không hợp lệ" sai khi voucher có điều kiện đơn tối thiểu)
      const listed = vouchers.find((v) => v.code === code.trim());
      const orderValue = listed ? listed.minOrderValue ?? 0 : 0;
      const res = await voucherService.validateVoucher(code.trim(), orderValue);
      const v = res.data.data;
      setResult({ ok: true, msg: `Hợp lệ! ${v.description || 'Voucher ' + v.code}` });
    } catch (e: any) {
      setResult({ ok: false, msg: e.response?.data?.message || 'Mã không tồn tại hoặc đã hết hạn' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Voucher của tôi</h1>
        <p className="text-gray-500 text-sm mt-0.5">{loading ? 'Đang tải...' : `${vouchers.length} voucher khả dụng`}</p>
      </div>

      {/* Check code */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-bold text-gray-900 text-sm mb-3">🎟️ Kiểm tra mã voucher</h3>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && checkCode()}
            placeholder="Nhập mã voucher..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase bg-gray-50 transition-all duration-200"
          />
          <button onClick={checkCode} disabled={checking || !code.trim()}
            className="px-5 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 disabled:opacity-60">
            {checking ? 'Đang kiểm tra...' : 'Kiểm tra'}
          </button>
        </div>
        {result && (
          <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {result.ok ? '✅' : '❌'} {result.msg}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Đang tải voucher...</p>
        </div>
      )}

      {/* Voucher cards */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4">
          {vouchers.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex card-hover transition-all duration-200">
              {/* Left red band */}
              <div className="w-20 bg-red-gradient flex flex-col items-center justify-center text-white shrink-0 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-50 rounded-full -translate-y-1/2" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-50 rounded-full translate-y-1/2" />
                <span className="font-black text-lg px-1 text-center leading-tight" style={{ fontFamily: 'Nunito' }}>
                  {v.discountType === 'PERCENTAGE' ? `-${v.discountValue}%` : `-${(v.discountValue / 1000).toFixed(0)}K`}
                </span>
              </div>

              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-black text-gray-900 font-mono text-sm">{v.code}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{v.description || 'Ưu đãi đặc biệt'}</div>
                  </div>
                  {!v.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Hết hiệu lực</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                  <span>Đơn tối thiểu: <b className="text-gray-600">{v.minOrderValue && v.minOrderValue > 0 ? `${(v.minOrderValue / 1000).toFixed(0)}K₫` : 'Không'}</b></span>
                  <span>Giảm tối đa: <b className="text-gray-600">{v.maxDiscount ? `${(v.maxDiscount / 1000).toFixed(0)}K₫` : '—'}</b></span>
                  <span>HSD: <b className="text-gray-600">{formatDate(v.endDate)}</b></span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { navigator.clipboard?.writeText(v.code); setResult({ ok: true, msg: `Đã sao chép mã ${v.code}` }); }}
                    className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    📋 Sao chép mã
                  </button>
                  <span className="text-xs text-gray-400">Hết hạn: {formatDate(v.endDate)}</span>
                </div>
              </div>
            </div>
          ))}

          {vouchers.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="text-5xl mb-3">🎟️</div>
              <p className="text-gray-400 font-medium">Chưa có voucher khả dụng</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
