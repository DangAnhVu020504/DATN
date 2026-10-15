import { useState } from 'react';

export default function DriverProfilePage() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: 'Trần Minh Khoa', email: 'khoa.driver@speed.vn', phone: '0908 765 432' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const stats = [
    { label: 'Tổng thu nhập', value: '24,500,000₫', icon: '💵' },
    { label: 'Tổng đơn giao', value: '142', icon: '📦' },
    { label: 'Đánh giá TB', value: '4.8 / 5', icon: '⭐' },
    { label: 'Tỉ lệ hoàn thành', value: '97.2%', icon: '✅' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Hồ sơ tài xế</h1>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 bg-red-gradient rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-red-200" style={{ fontFamily: 'Nunito' }}>K</div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-xs">📷</button>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>{form.fullName}</h2>
          <p className="text-gray-500 text-sm">{form.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-semibold">✅ Đã xác minh</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">🚗 Tài xế</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-lg font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Thông tin cá nhân</h3>
          <button onClick={() => setEditing(!editing)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${editing ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
            {editing ? 'Hủy' : '✏️ Chỉnh sửa'}
          </button>
        </div>
        <div className="space-y-4">
          {[{ label: 'Họ và tên', key: 'fullName' as const }, { label: 'Email', key: 'email' as const }, { label: 'Số điện thoại', key: 'phone' as const }].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
              {editing
                ? <input value={form[key]} onChange={set(key)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
                : <div className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-800">{form[key]}</div>}
            </div>
          ))}
        </div>
        {editing && (
          <button onClick={() => setEditing(false)}
            className="mt-5 w-full py-3 bg-red-gradient text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:opacity-90 transition-all">
            💾 Cập nhật hồ sơ
          </button>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">🔒 Đổi mật khẩu</h3>
        <div className="space-y-3">
          {['Mật khẩu hiện tại', 'Mật khẩu mới'].map(l => (
            <div key={l}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{l}</label>
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
          🔑 Đổi mật khẩu
        </button>
      </div>
    </div>
  );
}
