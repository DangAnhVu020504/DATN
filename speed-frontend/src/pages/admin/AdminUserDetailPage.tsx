import { Link, useParams } from 'react-router-dom';

const LOGS = [
  { action: 'LOGIN', entity: 'Auth', time: '09/09/2026 14:30', ip: '192.168.1.1' },
  { action: 'CREATE_ORDER', entity: 'Order SPD-047', time: '09/09/2026 14:32', ip: '192.168.1.1' },
  { action: 'UPDATE_PROFILE', entity: 'User', time: '08/09/2026 10:15', ip: '192.168.1.1' },
  { action: 'CANCEL_ORDER', entity: 'Order SPD-039', time: '07/09/2026 16:45', ip: '192.168.1.1' },
  { action: 'LOGIN', entity: 'Auth', time: '06/09/2026 09:00', ip: '10.0.0.5' },
];

export default function AdminUserDetailPage() {
  const { id } = useParams();

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/users" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">←</Link>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Chi tiết người dùng #{id}</h1>
      </div>

      {/* User card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-red-gradient rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-100" style={{ fontFamily: 'Nunito' }}>
            A
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito' }}>Nguyễn Văn An</h2>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">CUSTOMER</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">● Hoạt động</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors">🔕 Vô hiệu</button>
                <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">🗑️ Xóa</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: 'Email', value: 'an.nguyen@gmail.com' },
            { label: 'Số điện thoại', value: '0901 234 567' },
            { label: 'Ngày tạo', value: '01/01/2026' },
            { label: 'Vai trò', value: 'CUSTOMER' },
            { label: 'Trạng thái', value: 'ACTIVE' },
            { label: 'Tổng đơn hàng', value: '24 đơn' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
              <div className="text-sm font-semibold text-gray-800">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Lịch sử hoạt động (Audit Logs)</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Hành động', 'Đối tượng', 'Thời gian', 'IP'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {LOGS.map((l, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">{l.action}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{l.entity}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{l.time}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Link to="/admin/users" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
          ← Quay lại danh sách
        </Link>
      </div>
    </div>
  );
}
