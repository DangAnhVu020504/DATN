import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { authService } from '@/services/authService';
import { orderService } from '@/services/orderService';
import { updateUser } from '@/redux/slices/authSlice';

const formatPrice = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + '₫';

export default function ProfilePage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const customerId = user?.customerId;
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: '',
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ total: 0, delivered: 0, spent: 0 });

  useEffect(() => {
    authService.getProfile()
      .then((res) => {
        const p = res.data.data;
        setForm((f) => ({ ...f, fullName: p.fullName, phone: p.phone || '' }));
      })
      .catch(() => { });
    if (customerId) {
      orderService.getCustomerOrders(customerId, 0, 100)
        .then((res) => {
          const orders = res.data.data.content;
          const delivered = orders.filter((o) => o.status === 'DELIVERED');
          setStats({
            total: orders.length,
            delivered: delivered.length,
            spent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
          });
        })
        .catch(() => { });
    }
  }, [customerId]);

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200';

  const handleSave = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({ fullName: form.fullName, phone: form.phone });
      dispatch(updateUser({ fullName: form.fullName, phone: form.phone }));
      setEditMode(false);
      setMessage('✅ Cập nhật thông tin thành công');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('❌ ' + (err.response?.data?.message || 'Cập nhật thất bại'));
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(pwForm.current, pwForm.next);
      setMessage('✅ Đổi mật khẩu thành công');
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const setPw = (k: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Hồ sơ cá nhân</h1>
        <p className="text-gray-500 text-sm mt-0.5">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-medium">{message}</div>
      )}

      {/* Avatar card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 bg-red-gradient rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-100" style={{ fontFamily: 'Nunito' }}>
              {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-xs hover:bg-gray-50">📷</button>
          </div>
          <div className="flex-1">
            <div className="text-xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>{user?.fullName}</div>
            <div className="text-sm text-gray-400">{user?.email}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">● Hoạt động</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Khách hàng</span>
            </div>
          </div>
          <button onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
            {editMode ? '✖ Hủy' : '✏️ Chỉnh sửa'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          {[
            { label: 'Tổng đơn', value: String(stats.total) },
            { label: 'Thành công', value: String(stats.delivered) },
            { label: 'Tổng chi tiêu', value: formatPrice(stats.spent) },
            { label: 'Thành viên từ', value: user ? new Date().getFullYear() >= 2026 ? '01/2026' : '—' : '—' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-red-600" style={{ fontFamily: 'Nunito' }}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito' }}>Thông tin cá nhân</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên</label>
            <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} disabled={!editMode} className={`${inputCls} disabled:opacity-60 disabled:bg-gray-100`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input value={form.email} disabled className={`${inputCls} disabled:opacity-60 disabled:bg-gray-100`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={!editMode} placeholder="0901 234 567" className={`${inputCls} disabled:opacity-60 disabled:bg-gray-100`} />
          </div>
          {editMode && (
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 bg-red-gradient text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang lưu...</> : '💾 Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/profile/addresses" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-3 card-hover transition-all duration-200">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">📍</div>
          <div>
            <div className="text-sm font-bold text-gray-800">Sổ địa chỉ</div>
            <div className="text-xs text-gray-400">3 địa chỉ đã lưu</div>
          </div>
          <span className="ml-auto text-gray-300">→</span>
        </Link>
        <Link to="/notifications" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-3 card-hover transition-all duration-200">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl">🔔</div>
          <div>
            <div className="text-sm font-bold text-gray-800">Thông báo</div>
            <div className="text-xs text-gray-400">2 chưa đọc</div>
          </div>
          <span className="ml-auto text-gray-300">→</span>
        </Link>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito' }}>Đổi mật khẩu</h3>
        {pwError && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{pwError}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <input type="password" value={pwForm.current} onChange={setPw('current')} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
              <input type="password" value={pwForm.next} onChange={setPw('next')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <input type="password" value={pwForm.confirm} onChange={setPw('confirm')} className={inputCls} />
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={saving || !pwForm.current || !pwForm.next}
            className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40">
            🔒 Cập nhật mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
}
