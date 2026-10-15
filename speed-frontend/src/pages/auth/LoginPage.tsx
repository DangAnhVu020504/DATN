import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';
import { loginAsync, clearError } from '@/redux/slices/authSlice';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((s: RootState) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginAsync({ email, password }));
    if (loginAsync.fulfilled.match(result)) {
      const roles = result.payload.roles ?? [];
      if (roles.some((r) => r.includes('ADMIN'))) navigate('/admin');
      else if (roles.some((r) => r.includes('DRIVER'))) navigate('/driver');
      else navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-red-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-[-40px] w-32 h-32 rounded-full bg-white/10" />

        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-4xl font-black text-red-600" style={{ fontFamily: 'Nunito' }}>S</span>
          </div>
          <h1 className="text-4xl font-black mb-3" style={{ fontFamily: 'Nunito' }}>Speed Delivery</h1>
          <p className="text-red-100 text-lg font-medium mb-8">Giao hàng nhanh – Tin cậy – An toàn</p>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: '⚡', label: 'Siêu tốc', desc: 'Giao trong 60 phút' },
              { icon: '📍', label: 'Theo dõi', desc: 'Realtime GPS' },
              { icon: '🛡️', label: 'Bảo đảm', desc: 'Đền bù 100%' },
            ].map((f) => (
              <div key={f.label} className="bg-white/15 backdrop-blur rounded-2xl p-4 text-left">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-bold text-sm">{f.label}</div>
                <div className="text-red-100 text-xs mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-gradient rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg" style={{ fontFamily: 'Nunito' }}>S</span>
            </div>
            <span className="font-black text-gray-900 text-xl" style={{ fontFamily: 'Nunito' }}>Speed Delivery</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Nunito' }}>Chào mừng!</h2>
            <p className="text-gray-500">Đăng nhập để tiếp tục sử dụng dịch vụ</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-red-gradient text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:shadow-red-300 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                '🚀 Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">Chưa có tài khoản? </span>
            <Link to="/register" className="text-sm font-bold text-red-600 hover:text-red-700">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
