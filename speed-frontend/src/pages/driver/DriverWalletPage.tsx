import { useState } from 'react';

const TRANSACTIONS = [
  { id: 1, type: 'CREDIT', desc: 'Giao đơn SPD-2026-044', amount: '+55,000₫', date: '09/09 11:15' },
  { id: 2, type: 'CREDIT', desc: 'Giao đơn SPD-2026-043', amount: '+35,000₫', date: '09/09 09:30' },
  { id: 3, type: 'DEBIT',  desc: 'Rút tiền về tài khoản',   amount: '-200,000₫', date: '08/09 18:00' },
  { id: 4, type: 'CREDIT', desc: 'Giao đơn SPD-2026-042', amount: '+42,000₫', date: '08/09 16:00' },
  { id: 5, type: 'CREDIT', desc: 'Thưởng hoàn thành 10 đơn', amount: '+50,000₫', date: '07/09 20:00' },
  { id: 6, type: 'DEBIT',  desc: 'Rút tiền về tài khoản',   amount: '-150,000₫', date: '06/09 17:30' },
];

export default function DriverWalletPage() {
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setAmount('');
      alert('Đã gửi yêu cầu rút tiền! (Demo)');
    }, 800);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Ví tài xế</h1>
        <p className="text-gray-500 text-sm mt-0.5">Quản lý thu nhập của bạn</p>
      </div>

      {/* Balance card */}
      <div className="bg-red-gradient rounded-3xl p-7 mb-6 relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-2">Số dư khả dụng</p>
          <p className="text-white text-4xl font-black mb-4" style={{ fontFamily: 'Nunito' }}>782,000₫</p>
          <div className="flex gap-4">
            <div>
              <p className="text-white/60 text-xs">Tuần này</p>
              <p className="text-white font-bold text-sm">+320,000₫</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-white/60 text-xs">Tháng này</p>
              <p className="text-white font-bold text-sm">+2,450,000₫</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-white/60 text-xs">Tổng đơn</p>
              <p className="text-white font-bold text-sm">142 đơn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h3 className="font-bold text-gray-900 mb-4">💸 Rút tiền</h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₫</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nhập số tiền..."
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={!amount || withdrawing}
            className="px-5 py-3 bg-red-gradient text-white font-bold rounded-xl text-sm shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {withdrawing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
            Rút tiền
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {['50000', '100000', '200000', '500000'].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="flex-1 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-600 transition-all duration-200"
            >
              {(Number(v) / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Lịch sử giao dịch</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {TRANSACTIONS.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                t.type === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {t.type === 'CREDIT' ? '⬆️' : '⬇️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{t.desc}</div>
                <div className="text-xs text-gray-400">{t.date}</div>
              </div>
              <div className={`font-bold text-sm ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                {t.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
