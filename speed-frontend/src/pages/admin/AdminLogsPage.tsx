import { useState } from 'react';

const LOGS = [
  { id: 1, user: 'Nguyễn Văn An', action: 'CREATE_ORDER', entity: 'Order SPD-047', entityId: '47', time: '09/09/2026 14:32' },
  { id: 2, user: 'Trần Minh Khoa', action: 'TOGGLE_AVAILABILITY', entity: 'Driver', entityId: '2', time: '09/09/2026 13:00' },
  { id: 3, user: 'Lê Thị Mai', action: 'LOGIN', entity: 'Auth', entityId: '—', time: '09/09/2026 12:30' },
  { id: 4, user: 'Phạm Thị D', action: 'CANCEL_ORDER', entity: 'Order SPD-039', entityId: '39', time: '08/09/2026 16:45' },
  { id: 5, user: 'Admin Hệ Thống', action: 'DELETE_USER', entity: 'User #12', entityId: '12', time: '08/09/2026 10:00' },
  { id: 6, user: 'Hoàng Minh E', action: 'UPDATE_PROFILE', entity: 'User', entityId: '5', time: '07/09/2026 09:15' },
  { id: 7, user: 'Nguyễn Văn An', action: 'SUBMIT_REVIEW', entity: 'Order SPD-043', entityId: '43', time: '06/09/2026 18:30' },
];

const ACTIONS = ['Tất cả', 'LOGIN', 'CREATE_ORDER', 'CANCEL_ORDER', 'UPDATE_PROFILE', 'TOGGLE_AVAILABILITY', 'DELETE_USER', 'SUBMIT_REVIEW'];

const ACTION_CLS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  CREATE_ORDER: 'bg-green-100 text-green-700',
  CANCEL_ORDER: 'bg-red-100 text-red-700',
  UPDATE_PROFILE: 'bg-purple-100 text-purple-700',
  TOGGLE_AVAILABILITY: 'bg-amber-100 text-amber-700',
  DELETE_USER: 'bg-red-200 text-red-800',
  SUBMIT_REVIEW: 'bg-yellow-100 text-yellow-700',
};

export default function AdminLogsPage() {
  const [actionFilter, setActionFilter] = useState('Tất cả');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = LOGS.filter(
    (l) =>
      (actionFilter === 'Tất cả' || l.action === actionFilter) &&
      l.user.toLowerCase().includes(userFilter.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-0.5">Lịch sử hoạt động toàn hệ thống</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
          <input
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Lọc theo người dùng..."
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white min-w-48 transition-all duration-200"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 min-w-44 transition-all duration-200"
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Người dùng', 'Hành động', 'Đối tượng', 'Entity ID', 'Thời gian'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-red-gradient rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {l.user.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{l.user}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded-lg font-semibold ${ACTION_CLS[l.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{l.entity}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-400">{l.entityId}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Không tìm thấy log nào.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-400">{filtered.length} log</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200 ${
                page === p ? 'bg-red-gradient text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
