import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';
import type { LogResponse } from '@/types';

const ACTION_CLS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  CREATE_ORDER: 'bg-green-100 text-green-700',
  CANCEL_ORDER: 'bg-red-100 text-red-700',
  UPDATE_PROFILE: 'bg-purple-100 text-purple-700',
  TOGGLE_AVAILABILITY: 'bg-amber-100 text-amber-700',
  TOGGLE_USER_ACTIVE: 'bg-amber-100 text-amber-700',
  DELETE_USER: 'bg-red-200 text-red-800',
  SUBMIT_REVIEW: 'bg-yellow-100 text-yellow-700',
  ASSIGN_DRIVER: 'bg-blue-100 text-blue-700',
  COMPLETE_DELIVERY: 'bg-green-100 text-green-700',
};

export default function AdminLogsPage() {
  const [actionFilter, setActionFilter] = useState('Tất cả');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminService
      .getLogs(page - 1, 20)
      .then((res) => {
        setLogs(res.data.data?.content ?? []);
        setTotalPages(res.data.data?.totalPages ?? 0);
      })
      .catch(() => setError('Không thể tải audit logs'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const actions = useMemo(() => ['Tất cả', ...Array.from(new Set(logs.map((l) => l.action)))], [logs]);

  const filtered = logs.filter(
    (l) =>
      (actionFilter === 'Tất cả' || l.action === actionFilter) &&
      String(l.userId).includes(userFilter.trim())
  );

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-0.5">Lịch sử hoạt động toàn hệ thống</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">⚠️ {error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
          <input
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Lọc theo User ID..."
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white min-w-48 transition-all duration-200"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 min-w-44 transition-all duration-200"
        >
          {actions.map((a) => (
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
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <div className="w-6 h-6 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            )}
            {!loading && filtered.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors" title={l.details}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-red-gradient rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      U
                    </div>
                    <span className="text-sm font-medium text-gray-800">User #{l.userId}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded-lg font-semibold ${ACTION_CLS[l.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{l.entityType}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-400">{l.entityId ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Không tìm thấy log nào.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-400">Trang {page}/{totalPages}</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
      )}
    </div>
  );
}