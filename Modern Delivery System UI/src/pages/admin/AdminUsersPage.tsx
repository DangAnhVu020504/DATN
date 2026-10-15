import { useState } from 'react';
import { Link } from 'react-router';

const USERS = [
  { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0901 234 567', role: 'CUSTOMER', status: 'ACTIVE', created: '01/01/2026' },
  { id: 2, name: 'Trần Minh Khoa', email: 'khoa.driver@speed.vn', phone: '0908 765 432', role: 'DRIVER', status: 'ACTIVE', created: '15/02/2026' },
  { id: 3, name: 'Lê Thị Mai', email: 'mai.le@gmail.com', phone: '0912 345 678', role: 'CUSTOMER', status: 'ACTIVE', created: '10/03/2026' },
  { id: 4, name: 'Phạm Quốc Toản', email: 'toan.driver@speed.vn', phone: '0933 123 456', role: 'DRIVER', status: 'INACTIVE', created: '20/03/2026' },
  { id: 5, name: 'Hoàng Thị Lan', email: 'lan.hoang@gmail.com', phone: '0944 567 890', role: 'CUSTOMER', status: 'ACTIVE', created: '05/04/2026' },
  { id: 6, name: 'Admin Hệ Thống', email: 'admin@speed.vn', phone: '0900 000 001', role: 'ADMIN', status: 'ACTIVE', created: '01/01/2026' },
];

const ROLE_CLS: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  DRIVER: 'bg-amber-100 text-amber-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [users, setUsers] = useState(USERS);

  const filtered = users.filter(u =>
    (roleFilter === 'ALL' || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleActive = (id: number) =>
    setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u));

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} người dùng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[['ALL','Tất cả'],['CUSTOMER','Khách hàng'],['DRIVER','Tài xế'],['ADMIN','Admin']].map(([k,l]) => (
            <button key={k} onClick={() => setRoleFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${roleFilter === k ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Người dùng','SĐT','Vai trò','Trạng thái','Ngày tạo','Hành động'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-gradient rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.phone}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_CLS[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.status === 'ACTIVE' ? '● Hoạt động' : '○ Vô hiệu'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{u.created}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link to={`/admin/users/${u.id}`}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors text-sm">👁</Link>
                    <button onClick={() => toggleActive(u.id)}
                      className={`p-1.5 rounded-lg transition-colors text-sm ${u.status === 'ACTIVE' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}>
                      {u.status === 'ACTIVE' ? '🔕' : '🔔'}
                    </button>
                    <button onClick={() => setDeleteId(u.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-400">{filtered.length} người dùng</p>
        <div className="flex gap-1">
          {[1,2,3].map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${page === p ? 'bg-red-gradient text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="font-black text-gray-900 text-center text-lg mb-2" style={{ fontFamily: 'Nunito' }}>Xác nhận xóa?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Hủy</button>
              <button onClick={() => { setUsers(us => us.filter(u => u.id !== deleteId)); setDeleteId(null); }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
