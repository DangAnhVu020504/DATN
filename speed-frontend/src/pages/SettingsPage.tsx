import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${enabled ? 'bg-red-500' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
          enabled ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [notif, setNotif] = useState({ push: true, email: false, sms: true, promo: false });
  const [prefs, setPrefs] = useState({ language: 'vi', theme: 'light' });
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const rows: { key: keyof typeof notif; icon: string; label: string; desc: string }[] = [
    { key: 'push', icon: '🔔', label: 'Thông báo đẩy', desc: 'Nhận thông báo trạng thái đơn hàng real-time' },
    { key: 'email', icon: '📧', label: 'Thông báo Email', desc: 'Gửi hóa đơn và cập nhật qua email' },
    { key: 'sms', icon: '📱', label: 'Thông báo SMS', desc: 'Nhập SMS khi tài xế đến điểm giao' },
    { key: 'promo', icon: '🎁', label: 'Ưu đãi & Khuyến mãi', desc: 'Nhận thông báo về voucher mới' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Cài đặt</h1>
        <p className="text-gray-500 text-sm mt-0.5">Tùy chỉnh trải nghiệm sử dụng</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito' }}>🔔 Thông báo</h3>
        <div className="divide-y divide-gray-50">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-4 py-3.5">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shrink-0">{r.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{r.label}</div>
                <div className="text-xs text-gray-400">{r.desc}</div>
              </div>
              <Toggle enabled={notif[r.key]} onChange={() => setNotif((n) => ({ ...n, [r.key]: !n[r.key] }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito' }}>⚙️ Tùy chỉnh chung</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngôn ngữ</label>
            <select
              value={prefs.language}
              onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200"
            >
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chế độ hiển thị</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['light', '☀️ Sáng'],
                ['dark', '🌙 Tối'],
              ] as ['light' | 'dark', string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setPrefs((p) => ({ ...p, theme: t }))}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    prefs.theme === t ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:border-red-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito' }}>👤 Tài khoản</h3>
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-red-gradient rounded-full flex items-center justify-center text-white font-bold shrink-0">
            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
            {user?.roles?.[0] ?? 'USER'}
          </span>
        </div>
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
        >
          🚪 Đăng xuất
        </button>
      </div>

      <p className="text-center text-xs text-gray-300">Speed Delivery System · v1.0.0</p>

      {/* Logout confirm */}
      {confirmLogout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-4xl text-center mb-3">👋</div>
            <h3 className="font-black text-gray-900 text-center text-lg mb-2" style={{ fontFamily: 'Nunito' }}>Đăng xuất?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">Bạn có chắc muốn thoát khỏi ứng dụng?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Ở lại
              </button>
              <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
