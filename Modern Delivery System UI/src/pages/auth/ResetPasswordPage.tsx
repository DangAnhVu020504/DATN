import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', otp: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/login'); }, 900);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
            <span className="text-white font-black text-2xl" style={{ fontFamily: 'Nunito' }}>S</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Speed Delivery</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 p-8">
          <div className="text-center mb-7">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Nunito' }}>Đặt lại mật khẩu</h2>
            <p className="text-gray-500 text-sm">Nhập mã OTP và mật khẩu mới của bạn</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="example@gmail.com" required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã OTP</label>
              <input type="text" value={form.otp} onChange={set('otp')} placeholder="6 chữ số" maxLength={6} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 tracking-[0.5em] text-center font-mono" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-red-gradient text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 mt-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang xử lý...</> : '✅ Đặt lại mật khẩu'}
            </button>
          </form>
          <div className="mt-5 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-red-600 transition-colors">← Quay lại Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
