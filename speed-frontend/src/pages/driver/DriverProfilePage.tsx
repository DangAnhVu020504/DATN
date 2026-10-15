import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

export default function DriverProfilePage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    phone: '',
    vehicle: 'Honda Wave Alpha',
    plate: '59-X1 123.45',
  });
  const [saving, setSaving] = useState(false);

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200';

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Wire to driverService.updateProfile
      await new Promise((r) => setTimeout(r, 600));
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: 'Tổng đơn', value: '142', icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Đánh giá', value: '4.8 ⭐', icon: '⭐', color: 'bg-amber-50 text-amber-600' },
    { label: 'Tỷ lệ đúng giờ', value: '98%', icon: '⏱️', color: 'bg-green-50 text-green-600' },
    { label: 'Thành viên từ', value: '02/2026', icon: '📅', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Hồ sơ tài xế</h1>
        <p className="text-gray-500 text-sm mt-0.5">Thông tin và phương tiện của bạn</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 bg-red-gradient rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-100" style={{ fontFamily: 'Nunito' }}>
              {(user?.fullName ?? 'D').charAt(0).toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-xs hover:bg-gray-50">📷</button>
          </div>
          <div className="flex-1">
            <div className="text-xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>{user?.fullName}</div>
            <div className="text-sm text-gray-400">{user?.email}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">● Online</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Tài xế</span>
            </div>
          </div>
          <button onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
            {editMode ? '✖ Hủy' : '✏️ Chỉnh sửa'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mx-auto mb-1.5 text-base`}>{s.icon}</div>
              <div className="text-sm font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito' }}>🛵 Phương tiện</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại xe</label>
            <input value={form.vehicle} onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))} disabled={!editMode}
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-100`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Biển số xe</label>
            <input value={form.plate} onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))} disabled={!editMode}
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-100 font-mono`} />
          </div>
          {editMode && (
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 bg-red-gradient text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang lưu...</> : '💾 Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito' }}>👤 Thông tin cá nhân</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên</label>
            <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} disabled={!editMode}
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-100`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input value={user?.email ?? ''} disabled className={`${inputCls} disabled:opacity-60 disabled:bg-gray-100`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={!editMode} placeholder="0908 765 432"
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-100`} />
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito' }}>🔒 Đổi mật khẩu</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <input type="password" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
              <input type="password" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận</label>
              <input type="password" className={inputCls} />
            </div>
          </div>
          <button className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
            Cập nhật mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
}
