import { useState } from 'react';

const VOUCHERS = [
  { code: 'SPEED20K', desc: 'Giảm 20,000₫ cho đơn từ 50,000₫', type: 'FIXED_AMOUNT', value: '20,000₫', minOrder: '50,000₫', expiry: '30/09/2026', used: 0, max: 100 },
  { code: 'FIRST15', desc: 'Giảm 15% đơn đầu tiên, tối đa 30,000₫', type: 'PERCENTAGE', value: '15%', minOrder: '30,000₫', expiry: '31/12/2026', used: 45, max: 200 },
  { code: 'VIP50K', desc: 'Giảm 50,000₫ cho thành viên VIP', type: 'FIXED_AMOUNT', value: '50,000₫', minOrder: '150,000₫', expiry: '15/10/2026', used: 12, max: 50 },
  { code: 'EXPRESS10', desc: 'Giảm 10% phí dịch vụ Hỏa tốc', type: 'PERCENTAGE', value: '10%', minOrder: '0₫', expiry: '20/09/2026', used: 88, max: 100 },
];

export default function VoucherListPage() {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<null | 'ok' | 'err'>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const check = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setResult(VOUCHERS.some(v => v.code === code.toUpperCase()) ? 'ok' : 'err');
    }, 700);
  };

  const copy = (c: string) => {
    navigator.clipboard.writeText(c).catch(() => {});
    setCopied(c);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Voucher & Ưu đãi</h1>
        <p className="text-gray-500 text-sm mt-0.5">Sử dụng mã giảm giá khi đặt đơn hàng</p>
      </div>

      {/* Check box */}
      <div className="bg-red-gradient rounded-2xl p-5 mb-6">
        <p className="text-white font-semibold text-sm mb-3">🎟️ Kiểm tra mã voucher</p>
        <div className="flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="Nhập mã voucher..."
            className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-white/90 font-mono font-bold tracking-wider placeholder:font-normal placeholder:tracking-normal"
            style={{ color: '#E8192C' }} />
          <button onClick={check} disabled={!code || checking}
            className="bg-white text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm hover:shadow-lg transition-all disabled:opacity-50">
            {checking ? '...' : 'Kiểm tra'}
          </button>
        </div>
        {result === 'ok' && <p className="text-white/90 text-xs mt-2">✅ Mã hợp lệ! Áp dụng khi tạo đơn.</p>}
        {result === 'err' && <p className="text-yellow-200 text-xs mt-2">❌ Mã không hợp lệ hoặc đã hết hạn.</p>}
      </div>

      {/* Voucher list */}
      <div className="space-y-3">
        {VOUCHERS.map(v => {
          const pct = Math.round((v.used / v.max) * 100);
          const nearExpiry = pct > 80;
          return (
            <div key={v.code} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex">
                {/* Left accent */}
                <div className="w-3 bg-red-gradient shrink-0" />
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-gray-900 font-mono text-sm">{v.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          v.type === 'PERCENTAGE' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {v.type === 'PERCENTAGE' ? '% Phần trăm' : '₫ Số tiền'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{v.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-red-600" style={{ fontFamily: 'Nunito' }}>-{v.value}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                    <span>Đơn tối thiểu: <b className="text-gray-600">{v.minOrder}</b></span>
                    <span>HSD: <b className={nearExpiry ? 'text-red-500' : 'text-gray-600'}>{v.expiry}</b></span>
                  </div>
                  {/* Usage bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Đã dùng {v.used}/{v.max}</span>
                      <span className={nearExpiry ? 'text-red-500 font-semibold' : ''}>{nearExpiry ? '⚠️ Sắp hết' : `${100 - pct}% còn lại`}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${nearExpiry ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button onClick={() => copy(v.code)}
                    className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
                    {copied === v.code ? '✅ Đã sao chép!' : '📋 Sao chép mã'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
