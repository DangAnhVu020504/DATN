import { useState } from 'react';

export default function ProfilePage() {
  const [form, setForm] = useState({ fullName: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0901 234 567' });
  const [editing, setEditing] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Hồ sơ cá nhân</h1>
        <p className="text-gray-500 text-sm mt-0.5">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 bg-red-gradient rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-red-200" style={{ fontFamily: 'Nunito' }}>
            A
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-xs hover:border-red-300 transition-colors">📷</button>
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>{form.fullName}</h2>
          <p className="text-gray-500 text-sm">{form.email}</p>
          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-semibold mt-1">
            ✅ Đã xác minh
          </span>
        </div>
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
          {[
            { label: 'Họ và tên', key: 'fullName' as const, type: 'text' },
            { label: 'Email', key: 'email' as const, type: 'email' },
            { label: 'Số điện thoại', key: 'phone' as const, type: 'tel' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
              {editing ? (
                <input type={type} value={form[key]} onChange={set(key)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
              ) : (
                <div className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-800">{form[key]}</div>
              )}
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
        <h3 className="font-bold text-gray-900 mb-5">🔒 Đổi mật khẩu</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mật khẩu hiện tại</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mật khẩu mới</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
          </div>
        </div>
        <button className="mt-5 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
          🔑 Đổi mật khẩu
        </button>
      </div>
    </div>
  );
}
