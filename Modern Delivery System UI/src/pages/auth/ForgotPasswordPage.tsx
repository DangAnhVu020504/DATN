import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
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
          {!sent ? (
            <>
              <div className="text-center mb-7">
                <div className="text-5xl mb-4">🔑</div>
                <h2 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Nunito' }}>Quên mật khẩu?</h2>
                <p className="text-gray-500 text-sm">Nhập email để nhận mã OTP khôi phục mật khẩu</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-red-gradient text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    '📧 Gửi mã OTP'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Nunito' }}>Email đã được gửi!</h3>
              <p className="text-gray-500 text-sm mb-2">Chúng tôi đã gửi mã OTP đến</p>
              <p className="font-semibold text-red-600 mb-6">{email}</p>
              <button
                onClick={() => navigate('/reset-password')}
                className="w-full py-3.5 bg-red-gradient text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200"
              >
                🔒 Đặt lại mật khẩu
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1">
              ← Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
