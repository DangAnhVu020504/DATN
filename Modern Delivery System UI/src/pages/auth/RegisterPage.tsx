import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

type Role = 'CUSTOMER' | 'DRIVER';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 900);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="hidden lg:flex lg:w-5/12 bg-red-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full bg-white/5" />
        <div className="relative z-10 text-white text-center">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-4xl font-black text-red-600" style={{ fontFamily: 'Nunito' }}>S</span>
          </div>
          <h2 className="text-3xl font-black mb-3" style={{ fontFamily: 'Nunito' }}>Tham gia Speed!</h2>
          <p className="text-red-100 mb-10">Đăng ký ngay để trải nghiệm dịch vụ giao hàng siêu tốc</p>
          <div className="space-y-4">
            {[
              { icon: '🎁', text: 'Nhận ngay voucher 50K khi đăng ký' },
              { icon: '🚀', text: 'Giao hàng trong 60 phút tại nội thành' },
              { icon: '💳', text: 'Thanh toán đa dạng: tiền mặt, ví, CK' },
              { icon: '📱', text: 'Theo dõi đơn hàng realtime 24/7' },
            ].map((i) => (
              <div key={i.text} className="flex items-center gap-3 text-left">
                <span className="text-xl">{i.icon}</span>
                <span className="text-sm font-medium">{i.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-gradient rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg" style={{ fontFamily: 'Nunito' }}>S</span>
            </div>
            <span className="font-black text-gray-900 text-xl" style={{ fontFamily: 'Nunito' }}>Speed Delivery</span>
          </div>

          <div className="mb-7">
            <h2 className="text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Nunito' }}>Tạo tài khoản</h2>
            <p className="text-gray-500 text-sm">Điền thông tin để đăng ký tài khoản mới</p>
          </div>

          {/* Role tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            {(['CUSTOMER', 'DRIVER'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  role === r ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === 'CUSTOMER' ? '👤 Khách hàng' : '🚗 Tài xế'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên</label>
              <input
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Nguyễn Văn A"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="example@gmail.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="0901 234 567"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mật khẩu <span className="text-gray-400 font-normal">(tối thiểu 6 ký tự)</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-gradient text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                '✨ Đăng ký'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-red-600 hover:text-red-700">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
