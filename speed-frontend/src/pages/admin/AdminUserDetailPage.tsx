import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import type { LogResponse, UserResponse } from '@/types';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      adminService.getUserById(userId),
      adminService.getUserLogs(userId, 0, 20),
    ])
      .then(([userRes, logsRes]) => {
        setUser(userRes.data.data);
        setLogs(logsRes.data.data?.content ?? []);
      })
      .catch(() => setError('Không thể tải thông tin người dùng'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async () => {
    if (!user) return;
    setError('');
    setMessage('');
    try {
      await adminService.toggleUserActive(user.id, !user.isActive);
      setMessage(user.isActive ? 'Đã vô hiệu hóa người dùng' : 'Đã kích hoạt người dùng');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async () => {
    if (!user || !window.confirm('Xác nhận xóa người dùng này? Hành động không thể hoàn tác.')) return;
    setError('');
    try {
      await adminService.deleteUser(user.id);
      navigate('/admin/users');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  const role = (user?.roles?.[0] ?? 'CUSTOMER').replace('ROLE_', '');
  const formatDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/users" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">←</Link>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Chi tiết người dùng #{id}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">⚠️ {error}</div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-medium">✅ {message}</div>
      )}

      {/* User card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        {loading && (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loading && user && (
          <>
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-red-gradient rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-100" style={{ fontFamily: 'Nunito' }}>
                {(user.fullName ?? 'U').charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Nunito' }}>{user.fullName}</h2>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.isActive ? '● Hoạt động' : '○ Vô hiệu'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleToggleActive}
                      className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors">
                      {user.isActive ? '🔕 Vô hiệu' : '🔔 Kích hoạt'}
                    </button>
                    <button onClick={handleDelete}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
              {[
                { label: 'Email', value: user.email },
                { label: 'Số điện thoại', value: user.phone ?? '—' },
                { label: 'Ngày tạo', value: formatDate(user.createdAt) },
                { label: 'Vai trò', value: user.roles?.join(', ') ?? '—' },
                { label: 'Trạng thái', value: user.isActive ? 'ACTIVE' : 'INACTIVE' },
                { label: 'Xác thực', value: user.isVerified ? 'Đã xác thực' : 'Chưa xác thực' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
                  <div className="text-sm font-semibold text-gray-800 break-all">{value}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Audit logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Lịch sử hoạt động (Audit Logs)</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Hành động', 'Đối tượng', 'Chi tiết', 'Thời gian'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">{l.action}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{l.entityType} #{l.entityId}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-48 truncate">{l.details}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(l.createdAt)}</td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">Chưa có hoạt động nào</td>
              </tr>
            )}
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